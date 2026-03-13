import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <AlertTriangle size={48} className="text-gold mx-auto mb-4" />
            <h1 className="font-display text-2xl text-txt mb-2">Etwas ist schiefgelaufen</h1>
            <p className="text-sm text-txt-muted mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Lade die Seite neu, um fortzufahren.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gold text-bg px-5 py-2.5 rounded-sm font-body font-semibold text-sm"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
