import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacidad y datos | Lumbre",
  description: "Alcance de datos y privacidad de la demostración pública de Lumbre.",
};

export default function PrivacyPage() {
  return (
    <main className={styles.page} data-app-ready="true">
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Volver al inicio de Lumbre">
          <Image
            src="/brand/lumbre-mark-red.png"
            alt=""
            width={54}
            height={54}
            unoptimized
          />
          <span>Lumbre</span>
        </Link>
        <Link className={styles.back} href="/">Volver al portal</Link>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>TRANSPARENCIA / DEMOSTRACIÓN PÚBLICA</p>
        <h1>Privacidad clara,<br /><em>sin humo.</em></h1>
        <p>
          Esta página describe el comportamiento técnico del entorno público actual de
          Lumbre. No habilitamos cuentas, pagos reales, reservaciones ni suscripciones
          mientras no exista un responsable legal y un canal formal para ejercer derechos.
        </p>
        <dl className={styles.status} aria-label="Estado de privacidad de la demostración">
          <div><dt>Identidad</dt><dd>No solicitada</dd></div>
          <div><dt>Analítica publicitaria</dt><dd>No utilizada</dd></div>
          <div><dt>Datos sensibles</dt><dd>No solicitados</dd></div>
        </dl>
      </section>

      <section className={styles.content} aria-labelledby="current-scope-title">
        <article className={styles.primary}>
          <p className={styles.index}>01 — ALCANCE ACTUAL</p>
          <h2 id="current-scope-title">Qué ocurre cuando visitas Lumbre.</h2>

          <div className={styles.block} data-testid="anonymous-cart-privacy">
            <h3>Canasta anónima</h3>
            <p>
              Navegar no crea una cuenta. La primera vez que agregas un producto, Lumbre
              genera un identificador aleatorio en la cookie técnica <code>lumbre_session</code>.
              La base de datos relaciona ese identificador únicamente con productos y
              cantidades de la canasta. No contiene tu nombre ni tu correo.
            </p>
            <p>
              La cookie y su registro vencen después de 30 días de inactividad. Una tarea
              diaria elimina sesiones vencidas y sus canastas. Puedes borrar la cookie desde
              la configuración de tu navegador.
            </p>
          </div>

          <div className={styles.block}>
            <h3>Planes guardados en tu navegador</h3>
            <p>
              Si guardas un preset del Planificador de Brasas sin iniciar sesión, permanece
              solamente en el almacenamiento local de ese navegador. Puedes eliminar cada
              preset desde el planificador o borrar los datos locales del sitio.
            </p>
          </div>

          <div className={styles.block} data-testid="operational-logs-privacy">
            <h3>Registros operativos</h3>
            <p>
              Para detectar fallas, el Worker registra identificador de solicitud, método,
              ruta, estado y duración. El código de Lumbre no escribe cuerpos, cookies,
              nombres ni correos en esos registros. En el plan gratuito actual, Cloudflare
              conserva Workers Logs hasta por tres días.
            </p>
          </div>
        </article>

        <aside className={styles.aside} aria-labelledby="not-active-title">
          <p className={styles.index}>02 — NO ACTIVO</p>
          <h2 id="not-active-title">Lo que esta demostración no procesa.</h2>
          <ul>
            <li>Cuentas o enlaces de acceso por correo.</li>
            <li>Pagos, tarjetas o compras reales.</li>
            <li>Reservaciones para eventos.</li>
            <li>Membresías o envíos de boletines.</li>
            <li>Datos personales sensibles.</li>
          </ul>
          <p>
            Antes de activar cualquiera de estas funciones se publicará un aviso integral
            con identidad y domicilio del responsable, finalidades, transferencias, plazos
            y un medio verificable para ejercer derechos de acceso, rectificación,
            cancelación y oposición.
          </p>
        </aside>
      </section>

      <section className={styles.provider} aria-labelledby="provider-title">
        <p className={styles.index}>03 — INFRAESTRUCTURA</p>
        <h2 id="provider-title">Quién hace posible esta demostración.</h2>
        <p>
          Cloudflare hospeda el portal, la base D1, controles de abuso y registros técnicos;
          por ello puede procesar metadatos de red conforme a sus propios términos. Lumbre no
          vende información, no incorpora rastreadores publicitarios y no crea perfiles de
          comportamiento.
        </p>
      </section>

      <footer className={styles.footer}>
        <p>Última actualización: 25 de septiembre de 2026.</p>
        <p>
          Esta transparencia técnica no se presenta como aviso integral para servicios que
          todavía están desactivados.
        </p>
      </footer>
    </main>
  );
}
