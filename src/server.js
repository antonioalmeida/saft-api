import jsonServer from 'json-server'
import read from 'read-file'
import cors from 'cors'

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults({noCors: false})

const db = router.db.__wrapped__;

server.use(cors());

//Custom route test
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
})

//Average sales value
server.get('/sales/average-sales-value', (req, res) => {

	const { NumberOfEntries, TotalCredit } = db.SourceDocuments.SalesInvoices;

	const averageSalesValue = TotalCredit/NumberOfEntries;

	res.jsonp({
		averageSalesValue: averageSalesValue,
	});
});

server.use(middlewares)
server.use(router)
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})