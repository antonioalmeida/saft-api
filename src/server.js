import jsonServer from 'json-server'
import read from 'read-file'
import cors from 'cors'
import { ftruncate } from 'fs';

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

	const { NumberOfEntries, TotalCredit } = db.SalesInvoicesInfo;
	const averageSalesValue = TotalCredit / NumberOfEntries;

	res.jsonp({
		averageSalesValue: averageSalesValue,
	});
});

server.get('/sales/top-selling-products', (req, res) => {
	let products = new Map();

	db.SalesInvoices.forEach((invoice) => {
		const type = invoice.InvoiceType;

		// Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
		if (invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'VD'))
			invoice.Line.forEach((line) => {
				const { ProductDescription, Quantity } = line;

				if (products.has(ProductDescription))
					products.set(ProductDescription, products.get(ProductDescription) + parseInt(Quantity));
				else
					products.set(ProductDescription, parseInt(Quantity));
			});
	});

	res.json(strMapToObj(products));
});

server.get('/sales/total-gross-sales', (req, res) => {
	let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
	let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

	let totalSales = 0;
	db.SalesInvoices.forEach((invoice) => {
		let invoiceDate = new Date(invoice.InvoiceDate);
		if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
			totalSales += parseFloat(invoice.DocumentTotals.GrossTotal);
	});

	res.json({ totalSales: totalSales });
});

server.get('/sales/total-net-sales', (req, res) => {
	let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
	let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

	let totalSales = 0;
	db.SalesInvoices.forEach((invoice) => {
		let invoiceDate = new Date(invoice.InvoiceDate);
		if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
			totalSales += parseFloat(invoice.DocumentTotals.NetTotal);
	});

	res.json({ totalSales: totalSales });
});

server.get('/sales/total-tax', (req, res) => {
	let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
	let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

	let totalSales = 0;
	db.SalesInvoices.forEach((invoice) => {
		let invoiceDate = new Date(invoice.InvoiceDate);
		if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
			totalSales += parseFloat(invoice.DocumentTotals.TaxPayable);
	});

	res.json({ totalSales: totalSales });
});

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