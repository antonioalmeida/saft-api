import jsonServer from 'json-server'
import read from 'read-file'

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

const db = router.db.__wrapped__;

//Custom route test
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
})

//Average sales value
server.get('/sales/average-sales-value', (req, res) => {

	const { NumberOfEntries, TotalCredit } = db.SourceDocuments.SalesInvoices;

	const averageSalesValue = TotalCredit/NumberOfEntries;

	res.jsonp({
		value: averageSalesValue,
	});
});

server.use(middlewares)
server.use(router)
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})