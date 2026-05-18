const d = new Date('2026-04-01T00:00:00Z');
console.log(d.toLocaleDateString('en-GB').replace(/\//g, '-'));
