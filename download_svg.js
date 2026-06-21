const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/djaiss/mapsicon/master/all/in/vector.svg', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('india_raw.svg', data);
        console.log('Saved to india_raw.svg. Size:', data.length);
    });
}).on('error', (e) => {
    console.error(e);
});
