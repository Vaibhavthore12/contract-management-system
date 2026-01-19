'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
    useEffect(() => {
        // Load Swagger UI CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
        document.head.appendChild(link);

        // Load Swagger UI JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
        script.onload = () => {
            // @ts-expect-error SwaggerUIBundle is loaded via CDN
            window.SwaggerUIBundle({
                url: '/api/docs',
                dom_id: '#swagger-ui',
                presets: [
                    // @ts-expect-error SwaggerUIBundle is loaded via CDN
                    window.SwaggerUIBundle.presets.apis,
                ],
                layout: 'BaseLayout',
            });
        };
        document.body.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div id="swagger-ui" />
        </div>
    );
}
