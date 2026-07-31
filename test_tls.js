import tls from 'tls';

const host = 'www.saucedemo.com';
const port = 443;

console.log('Connecting...');
const socket = tls.connect(
    {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
    },
    () => {
        console.log('Connected!');
        socket.end();
    }
);

socket.on('error', (err) => {
    console.error('Error:', err);
});
socket.setTimeout(5000, () => {
    console.error('Timeout');
    socket.destroy();
});
