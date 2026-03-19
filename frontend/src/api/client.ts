const API_URL = 'http://localhost:5000';

export const api = {
    get: async (path: string) => {
        const res = await fetch(`${API_URL}${path}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    post: async (path: string, body: any) => {
        const res = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    put: async (path: string, body: any) => {
        const res = await fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    delete: async (path: string) => {
        const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }
};
