const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycjouAW306w0_YshZo2tqb8WNDY20QFEO_MOQy8Jex1S-lKjVbbjjQ1vMfnFWgzWMjSA/exec';

export default async function handler(req, res) {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data.' });
    }
}
