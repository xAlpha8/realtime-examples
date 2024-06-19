import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import styles from './index.module.css';

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <div className={styles.root}>
            <App />
        </div>
    );
}
