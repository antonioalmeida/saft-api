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

	let products = {};

	db.SalesInvoices.forEach((invoice) => {
		const type = invoice.InvoiceType;
		if(!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
			return;

		// Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
			invoice.Line.forEach((line) => {
				const { ProductCode, UnitPrice, ProductDescription, Quantity } = line;

				if(products.hasOwnProperty(ProductCode)){
					products[ProductCode].Quantity += parseInt(Quantity);
				} else {
					products[ProductCode] = { ProductDescription, UnitPrice: parseFloat(UnitPrice), Quantity: parseInt(Quantity) };
				}
			});
	});

	products = Object.keys(products)
			.sort((a,b) => products[b].Quantity - products[a].Quantity).map(elem => ({
				ProductCode: elem,
				ProductDescription: products[elem].ProductDescription,
				UnitPrice: products[elem].UnitPrice,
				Quantity: products[elem].Quantity
			}));

	res.json(products);
});

server.get('/sales/top-selling-products', (req, res) => {

	let products = {};

	let i = 0;
	db.SalesInvoices.forEach((invoice) => {

		const type = invoice.InvoiceType;
		if(!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
			return;

		// Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
			invoice.Line.forEach((line) => {
				const { ProductCode, UnitPrice, ProductDescription, Quantity } = line;

				if(products.hasOwnProperty(ProductCode)){
					products[ProductCode].Quantity += parseInt(Quantity);
				} else {
					products[ProductCode] = { ProductDescription, UnitPrice: parseFloat(UnitPrice), Quantity: parseInt(Quantity) };
				}
			});
	});

	products = Object.keys(products)
		  .sort((a,b) => products[b].Quantity - products[a].Quantity).map(elem => ({
			  ProductCode: elem,
			  ProductDescription: products[elem].ProductDescription,
			  UnitPrice: products[elem].UnitPrice,
			  Quantity: products[elem].Quantity
			}));

	res.json(products);
});

server.get('/GeneralAccounts/GroupingCategory/:filter', (req, res) => {
	let accounts = db.GeneralLedgerAccounts.Account.filter((account) => account.GroupingCategory === req.params.filter);

	res.json(accounts);
});

server.get('/sales/total-gross-sales', (req, res) => {
	let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
	let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

	let totalSales = 0;
	db.SalesInvoices.forEach((invoice) => {
		const type = invoice.InvoiceType;
		if(!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
			return;

		let invoiceDate = new Date(invoice.InvoiceDate);
		if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
			totalSales += parseFloat(invoice.DocumentTotals.GrossTotal);
	});

	res.json({ totalGrossSales: totalSales });
});

server.get('/sales/total-net-sales', (req, res) => {
	let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
	let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

	let totalSales = 0;
	db.SalesInvoices.forEach((invoice) => {
		const type = invoice.InvoiceType;
		if(!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
			return;

		let invoiceDate = new Date(invoice.InvoiceDate);
		if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
			totalSales += parseFloat(invoice.DocumentTotals.NetTotal);
	});

	res.json({ totalNetSales: totalSales });
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