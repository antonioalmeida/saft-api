module.exports = (server, db) => {

    server.get('/sales/top-selling-products', (req, res) => {

        let products = {};

        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            // Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
            invoice.Line.forEach((line) => {
                const {ProductCode, UnitPrice, ProductDescription, Quantity} = line;

                if (products.hasOwnProperty(ProductCode)) {
                    products[ProductCode].Quantity += parseInt(Quantity);
                } else {
                    products[ProductCode] = {
                        ProductDescription,
                        UnitPrice: parseFloat(UnitPrice),
                        Quantity: parseInt(Quantity)
                    };
                }
            });
        });

        products = Object.keys(products)
            .sort((a, b) => products[b].Quantity - products[a].Quantity).map(elem => ({
                ProductCode: elem,
                ProductDescription: products[elem].ProductDescription,
                UnitPrice: products[elem].UnitPrice,
                Quantity: products[elem].Quantity
            }));

        res.json(products);
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

        res.json({totalSales: totalSales});
    });

//Average sales value
    server.get('/sales/average-sales-value', (req, res) => {

        const {NumberOfEntries, TotalCredit} = db.SalesInvoicesInfo;
        const averageSalesValue = TotalCredit / NumberOfEntries;

        res.jsonp({
            averageSalesValue: averageSalesValue,
        });
    });


    server.get('/sales/total-orders-amount', (req, res) => {

        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let ordersAmount = 0;
        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
                ordersAmount++;
        });

        res.json({totalOrdersAmount: ordersAmount});
    });

    server.get('/sales/total-gross-sales', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let totalSales = 0;
        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
                totalSales += parseFloat(invoice.DocumentTotals.GrossTotal);
        });

        res.json({totalGrossSales: totalSales});
    });

    server.get('/sales/total-net-sales', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let totalSales = 0;
        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate))
                totalSales += parseFloat(invoice.DocumentTotals.NetTotal);
        });

        res.json({totalNetSales: totalSales});
    });

    server.get('/sales/daily-sales-volume', (req, res) => {

        let dailySales = {};

        db.SalesInvoices.forEach(invoice => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == "FT" || type == "FS" || type == "FR" || type == "VD"))) return;

            if (dailySales.hasOwnProperty(invoice.InvoiceDate)) {
                dailySales[invoice.InvoiceDate].NetTotal += parseFloat(invoice.DocumentTotals.NetTotal);
            } else {
                let date = new Date(invoice.InvoiceDate);
                let day = date.getDate();
                dailySales[invoice.InvoiceDate] = {
                    Day: day,
                    Period: parseInt(invoice.Period),
                    NetTotal: parseFloat(invoice.DocumentTotals.NetTotal)
                };
            }
        });

        dailySales = Object.keys(dailySales).reduce((r, v, i, a, k = dailySales[v].Period) => ((r[k] || (r[k] = [])).push(dailySales[v]), r), {});
        res.json(dailySales);
    });
};
