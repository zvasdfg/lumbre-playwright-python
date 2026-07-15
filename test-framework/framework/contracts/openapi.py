from __future__ import annotations

from copy import deepcopy
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate


class ContractViolation(AssertionError):
    """One request or response does not satisfy the published API contract."""


class OpenApiContract:
    """Validates live payloads against an OpenAPI 3.1 document.

    The adapter deliberately accepts a document obtained over HTTP. Contract
    tests therefore remain portable across local, CI, and remote BASE_URLs.
    """

    def __init__(self, document: dict[str, Any]) -> None:
        self.document = deepcopy(document)

    def validate_document(self) -> None:
        """Validate the OpenAPI structure before trusting its operation schemas."""
        try:
            validate(self.document)
        except Exception as error:
            raise ContractViolation(f"Invalid OpenAPI document: {error}") from error

    def validate_request(self, path: str, method: str, payload: Any) -> None:
        operation = self._operation(path, method)
        request_body = operation.get("requestBody")
        if request_body is None:
            raise ContractViolation(f"{method.upper()} {path} does not declare a request body")
        schema = self._json_schema(request_body, f"request for {method.upper()} {path}")
        self._validate(payload, schema, f"request for {method.upper()} {path}")

    def validate_response(self, path: str, method: str, status: int, payload: Any) -> None:
        operation = self._operation(path, method)
        responses = operation.get("responses", {})
        response = responses.get(str(status)) or responses.get("default")
        if response is None:
            declared = ", ".join(sorted(responses))
            raise ContractViolation(
                f"{method.upper()} {path} returned undocumented status {status}; "
                f"declared statuses: {declared}"
            )
        schema = self._json_schema(
            response,
            f"response {status} from {method.upper()} {path}",
        )
        self._validate(
            payload,
            schema,
            f"response {status} from {method.upper()} {path}",
        )

    def response_statuses(self, path: str, method: str) -> list[str]:
        operation = self._operation(path, method)
        return sorted(operation.get("responses", {}))

    def _operation(self, path: str, method: str) -> dict[str, Any]:
        try:
            operation = self.document["paths"][path][method.lower()]
        except KeyError as error:
            raise ContractViolation(
                f"Operation {method.upper()} {path} is missing from the OpenAPI document"
            ) from error
        if not isinstance(operation, dict):
            raise ContractViolation(f"Operation {method.upper()} {path} is not an object")
        return operation

    def _json_schema(self, container: dict[str, Any], context: str) -> dict[str, Any]:
        resolved_container = self._expand_references(container)
        try:
            schema = resolved_container["content"]["application/json"]["schema"]
        except KeyError as error:
            raise ContractViolation(f"No application/json schema declared for {context}") from error
        return self._expand_references(schema)

    def _expand_references(self, node: Any, trail: tuple[str, ...] = ()) -> Any:
        if isinstance(node, list):
            return [self._expand_references(item, trail) for item in node]
        if not isinstance(node, dict):
            return node

        reference = node.get("$ref")
        if reference is not None:
            if not isinstance(reference, str) or not reference.startswith("#/"):
                raise ContractViolation(
                    f"Only local OpenAPI references are supported: {reference!r}"
                )
            if reference in trail:
                raise ContractViolation(f"Circular OpenAPI reference detected: {reference}")
            target: Any = self.document
            try:
                for part in reference[2:].split("/"):
                    target = target[part.replace("~1", "/").replace("~0", "~")]
            except (KeyError, TypeError) as error:
                raise ContractViolation(f"OpenAPI reference does not exist: {reference}") from error
            siblings = {key: value for key, value in node.items() if key != "$ref"}
            resolved = self._expand_references(deepcopy(target), (*trail, reference))
            if not isinstance(resolved, dict):
                raise ContractViolation(f"OpenAPI reference is not a schema object: {reference}")
            return {
                **resolved,
                **self._expand_references(siblings, trail),
            }

        return {key: self._expand_references(value, trail) for key, value in node.items()}

    @staticmethod
    def _validate(payload: Any, schema: dict[str, Any], context: str) -> None:
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        errors = sorted(validator.iter_errors(payload), key=lambda error: list(error.absolute_path))
        if not errors:
            return

        details = []
        for error in errors[:10]:
            location = "$"
            for segment in error.absolute_path:
                location += f"[{segment}]" if isinstance(segment, int) else f".{segment}"
            details.append(f"{location}: {error.message}")
        remaining = len(errors) - len(details)
        if remaining > 0:
            details.append(f"... and {remaining} more violation(s)")
        raise ContractViolation(f"Schema violation in {context}:\n" + "\n".join(details))
