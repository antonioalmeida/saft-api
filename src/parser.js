import parser from 'xml2json'
import args from './index.js'
import read from 'read-file'
import writeFile from 'write'

//Read and parse XML file contents
read(args.source, (err, buffer) => {
    //TODO: process file reading errors

    // xml to json string
    const string = parser.toJson(buffer);

    const json = JSON.parse(string);

    const parsed = parseContents(json);

    writeFile.promise('db.json', parsed)
    .then(function() {
        //TODO: process errors
    });
});

const parseContents = (json) => {

	// Remove top 'AuditFile' key
	let parsed = json['AuditFile'];

	// Delete unused and conflicting keys
	delete parsed['xmlns:xsi'];
	delete parsed['xmlns:xsd'];
	delete parsed['xsi:schemaLocation'];
	delete parsed['xmlns'];

	// Move 'MasterFiles' up one level
	let MasterFiles = parsed.MasterFiles;
	delete parsed.MasterFiles;

	parsed = {
		...parsed,
		...MasterFiles
	};

	// Move 'TaxTable' up one level
	let TaxTable = parsed.TaxTable;
	delete parsed.TaxTable;

	parsed = {
		...parsed,
		...TaxTable
	};

	parseSourceDocuments(parsed);

	return JSON.stringify(parsed);
}

const parseSourceDocuments = (obj) => {

	let SalesInvoices = obj.SourceDocuments.SalesInvoices;

	const { Invoice, NumberOfEntries, TotalDebit, TotalCredit } = SalesInvoices;

	obj.SalesInvoicesInfo = {
		NumberOfEntries,
		TotalDebit,
		TotalCredit
	};

	obj.SalesInvoices = Invoice;

	let MovementOfGoods = obj.SourceDocuments.MovementOfGoods;

	const { NumberOfMovementLines, TotalQuantityIssued, StockMovement } = MovementOfGoods;

	obj.StockMovementsInfo = {
		NumberOfMovementLines,
		TotalQuantityIssued
	};

	obj.StockMovements = StockMovement;

	delete obj.SourceDocuments;
}

