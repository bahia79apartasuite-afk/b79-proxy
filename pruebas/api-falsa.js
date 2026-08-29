// API falsa con datos INVENTADOS, para probar las páginas sin tocar LobbyPMS.
//
//   node server.js                 # el proxy, en el 3000
//   node pruebas/api-falsa.js      # esta API falsa, en el 3001
//   abre: http://localhost:3000/?action=html&page=aseo&api=http://localhost:3001
//
// El parámetro ?api= hace que la página lea de aquí en vez de LobbyPMS, así que
// puedes cambiar el diseño sin credenciales, sin internet y sin datos reales.
// Los nombres son inventados a propósito: nunca uses huéspedes reales aquí.
const http = require('http');
const H = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' };
const D = {
  salidas: [
    { nombre:'Marta Quiroga',  habitacion:'201', fecha_ingreso:'2026-08-25', fecha_salida:'2026-08-29', adultos:2, ninos:0, notas:'Dejó toallas extra en el baño.', codigo_reserva:'INV-001' },
    { nombre:'Julián Beltrán', habitacion:'304', fecha_ingreso:'2026-08-27', fecha_salida:'2026-08-29', adultos:1, ninos:0, notas:'', codigo_reserva:'INV-002' },
  ],
  llegadas: [
    { nombre:'Rosa Melgarejo', habitacion:'201', fecha_ingreso:'2026-08-29', fecha_salida:'2026-09-02', adultos:2, ninos:1, notas:'Pidió cuna. Llega sobre las 3 pm.', codigo_reserva:'INV-003' },
    { nombre:'Iván Castaño',   habitacion:'102', fecha_ingreso:'2026-08-29', fecha_salida:'2026-08-31', adultos:2, ninos:0, notas:'', codigo_reserva:'INV-004' },
  ],
  aseo: [
    { nombre:'Familia Portillo', habitacion:'305', fecha_ingreso:'2026-08-26', fecha_salida:'2026-08-31', adultos:2, ninos:2, notas:'No entrar antes de las 11 am.', codigo_reserva:'INV-005' },
    { nombre:'Delia Sarmiento',  habitacion:'103', fecha_ingreso:'2026-08-28', fecha_salida:'2026-09-01', adultos:1, ninos:0, notas:'', codigo_reserva:'INV-006' },
    { nombre:'Óscar Fandiño',    habitacion:'202', fecha_ingreso:'2026-08-24', fecha_salida:'2026-09-03', adultos:2, ninos:0, notas:'', codigo_reserva:'INV-007' },
  ],
};
// facturacion = los tres unidos y deduplicados, con plata inventada
const tarifa = { 'INV-001':1840000, 'INV-002':620000, 'INV-003':2350000,
                 'INV-004':780000, 'INV-005':2900000, 'INV-006':960000, 'INV-007':3120000 };
D.facturacion = [].concat(D.salidas, D.llegadas, D.aseo).map(h => Object.assign({}, h, {
  total: tarifa[h.codigo_reserva] || 0,
  impuesto: Math.round((tarifa[h.codigo_reserva] || 0) * 0.19),
  agencia: ['Booking.com','Directo','Airbnb','Expedia'][h.codigo_reserva.charCodeAt(6) % 4],
  plan: ['Solo alojamiento','Con desayuno'][h.codigo_reserva.charCodeAt(6) % 2],
  estatus: 'Confirmada',
}));

http.createServer((req,res)=>{
  const a = new URL(req.url,'http://x').searchParams.get('action');
  res.writeHead(200,H);
  res.end(JSON.stringify({ ok:true, date:'2026-08-29', total:(D[a]||[]).length, huespedes: D[a]||[] }));
}).listen(3001, ()=>console.log('stub en 3001'));
