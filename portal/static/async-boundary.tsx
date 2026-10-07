import { Component, type ReactNode } from "react";

export default class AsyncBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert">
      <p>No se pudo cargar esta sección. Revisa tu conexión y recarga la página.</p>
      <button type="button" onClick={() => window.location.reload()}>Recargar página</button>
    </div>;
    return this.props.children;
  }
}
