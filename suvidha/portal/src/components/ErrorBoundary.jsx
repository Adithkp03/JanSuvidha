import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('JanSuvidha ErrorBoundary:', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                    <div className="max-w-lg bg-white rounded-2xl shadow-xl border border-rose-200 p-8 text-center">
                        <h1 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-sm text-slate-600 mb-4">
                            The app hit a runtime error. Open the browser console (F12) for details.
                        </p>
                        <pre className="text-left text-xs bg-slate-50 p-3 rounded-lg overflow-auto max-h-40 text-rose-700 mb-4">
                            {this.state.error?.message || String(this.state.error)}
                        </pre>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
