async function registerSW() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker has been registred!', registration);
            return registration;
        } catch (error) {
            console.error('SW registration error', error);
        }
    }
}

async function subscribeUser(registration, title, notifyTime) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        alert('Permission for requests have not been goten!');
        return;
    }

    const publicVapidKey = 'BND8q8T8vYfSufLZWLTwM_EUL_tgINYQ9tbc29JTDsC0rkf52cE0IZIP_UcUNGipb-qpCkUfLkhHRd7JqbOC7F4';
        
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    await fetch('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
            subscription,
            title,
            notifyTime: new Date(notifyTime).getTime()
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    alert('Notification successfully planned!');
}

document.getElementById('pushForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const notifyTime = document.getElementById('notifyTime').value;

    const reg = await registerSW();
    if (reg) {
        await subscribeUser(reg, title, notifyTime);
    }
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
    }