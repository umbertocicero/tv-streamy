import React from 'react';

export class LoadingBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Loading boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-box" style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>
          <p style={{ marginBottom: '10px' }}>⚠️ Errore nel caricamento dei dati</p>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            Ricarica
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook per loading state
export function LoadingSkeleton({ width = '100%', height = '100px', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
            borderRadius: 'var(--radius-md)',
            marginBottom: '8px',
          }}
        />
      ))}
    </>
  );
}
