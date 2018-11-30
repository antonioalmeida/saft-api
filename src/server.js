import jsonServer from 'json-server'
import read from 'read-file'
import cors from 'cors'
import { ftruncate } from 'fs';

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults({noCors: false})

const db = router.db.__wrapped__;

const salesController = require('./modules/sales');
const generalAccountsController = require('./modules/generalAccounts');

server.use(cors());

//Custom route test
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
})


generalAccountsController(server, db);
salesController(server, db);

server.use(middlewares)
server.use(router)
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})

function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k,v] of strMap) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        obj[k] = v;
    }
    return obj;
}

module.exports = server;
