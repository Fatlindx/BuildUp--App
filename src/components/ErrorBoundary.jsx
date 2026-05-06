import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('BuildUp Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#080808',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 24,
        }}>
          <img
            src="/logo-512.png" alt="BuildUp"
            style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', opacity: 0.5 }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Etwas ist schiefgelaufen
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Bitte lade die App neu.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', borderRadius: 10,
                background: '#22c55e', border: 'none',
                color: '#000', fontWeight: 700, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
