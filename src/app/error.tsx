'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="wrap unavailable"><h1>De pagina kan nu niet worden geladen.</h1><p>Probeer het later opnieuw.</p><button className="button" onClick={reset}>Opnieuw proberen ↗</button></section>;}
