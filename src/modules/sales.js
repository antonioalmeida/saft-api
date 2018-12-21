module.exports = (server, db) => {

    server.get('/sales/top-selling-products', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let products = {};

        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            // Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate)) {

                invoice.Line.forEach((line) => {
                    const {
                        ProductCode,
                        UnitPrice,
                        ProductDescription,
                        Quantity
                    } = line;

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
            }
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

    server.get('/sales/top-clients', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let clients = {};

        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate)) {

                const customer = invoice.CustomerID;

                let purchased = 0;

                invoice.Line.forEach((line) => {
                    const {
                        UnitPrice,
                        Quantity
                    } = line;

                    purchased += UnitPrice * Quantity;
                })

                if (clients.hasOwnProperty(customer)) {
                    clients[customer].totalPurchased += purchased;
                    clients[customer].nPurchases++;
                }
                else {
                    clients[customer] = {
                        totalPurchased: purchased,
                        nPurchases: 1
                    }
                }
            }

        })


        clients = Object.keys(clients)
            .sort((a, b) => clients[b].totalPurchased - clients[a].totalPurchased).map(elem => ({
                client: elem,
                totalPurchased: clients[elem].totalPurchased,
                nPurchases: clients[elem].nPurchases
            }));

        res.json(clients);
    })

    server.get('/sales/sales-by-region', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let countries = {};

        db.SalesInvoices.forEach((invoice) => {
            const type = invoice.InvoiceType;
            if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                return;

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate != null && invoiceDate < startDate) || (endDate != null && invoiceDate > endDate))
                return;

            const country = invoice.ShipTo.Address.Country;

            if (countries.hasOwnProperty(country)) {
                countries[country].quantity++;
                countries[country].netTotal += parseInt(invoice.DocumentTotals.NetTotal);
            } else {
                countries[country] = {
                    quantity: 1,
                    netTotal: parseInt(invoice.DocumentTotals.NetTotal)
                };
            }
        });

        countries = Object.keys(countries)
            //.sort((a, b) => countries[b].quantity - countries[a].quantity)
            .map(elem => ({
                id: elem,
                value: countries[elem].quantity,
                netTotal: countries[elem].netTotal
            }));

        res.json(countries);
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

        res.json({
            totalSales: totalSales
        });
    });

    //Average sales value
    server.get('/sales/average-sales-value', (req, res) => {

        const {
            NumberOfEntries,
            TotalCredit
        } = db.SalesInvoicesInfo;
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

        res.json({
            totalOrdersAmount: ordersAmount
        });
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

        res.json({
            totalGrossSales: totalSales
        });
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

        res.json({
            totalNetSales: totalSales
        });
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

    server.get('/sales/top-sales', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let sales = [];

        db.SalesInvoices.forEach((invoice) => {
            let invoiceDate = new Date(invoice.InvoiceDate);
            if (invoice.Line.length && (startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate)) {

                let products = [];
                invoice.Line.forEach((product) => {
                    products.push({
                        Code: product.ProductCode,
                        Description: product.ProductDescription,
                        UnitPrice: product.UnitPrice,
                        Quantity: product.Quantity
                    });
                });

                sales.push({
                    NetTotal: invoice.DocumentTotals.NetTotal,
                    GrossTotal: invoice.DocumentTotals.GrossTotal,
                    Customer: invoice.CustomerID,
                    Date: invoice.InvoiceDate,
                    Products: products
                });
            }
        });

        res.json(sales.sort((a, b) => b.NetTotal - a.NetTotal));
    });

    server.get('/sales/units-sold/:product', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let code = req.params.product;
        let units = 0;

        db.SalesInvoices.forEach((invoice) => {

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate)) {

                const type = invoice.InvoiceType;
                if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                    return;

                // Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
                invoice.Line.forEach((line) => {
                    const {
                        ProductCode,
                        Quantity
                    } = line;

                    if (ProductCode === code)
                        units += parseInt(Quantity);
                });
            }
        });

        res.json(units);
    });

    server.get('/sales/allSalesInvoicesValid', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let allInvoices = [];
        db.SalesInvoices.forEach((invoice) => {

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate)) {

                const type = invoice.InvoiceType;
                if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                    return;

                // Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
                allInvoices.push(invoice);
            }
        });

        res.json(allInvoices);
    });

    server.get('/sales/top-purchases/:customer', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let customer_id = req.params.customer;
        let products = [];

        db.SalesInvoices.forEach((invoice) => {

            let invoiceDate = new Date(invoice.InvoiceDate);
            if ((startDate == null || startDate <= invoiceDate) && (endDate == null || invoiceDate <= endDate)) {

                const type = invoice.InvoiceType;
                if (!(invoice.Line.length && (type == 'FT' || type == 'FS' || type == 'FR' || type == 'VD')))
                    return;

                if (invoice.CustomerID !== customer_id)
                    return;

                // Document type must be 'Fatura', 'Fatura Simplificada', 'Fatura Recibo' or 'Venda a Dinheiro'
                invoice.Line.forEach((line) => {
                    const {
                        ProductCode,
                        ProductDescription,
                        Quantity
                    } = line;

                    var found = false;
                    for (let i = 0; i < products.length; i++) {
                        if (products[i].ProductCode === ProductCode) {
                            products[i].Quantity = parseInt(products[i].Quantity) + parseInt(Quantity);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        products.push({
                            ProductCode,
                            ProductDescription,
                            Quantity
                        });
                    }

                    products.sort(function (a, b) {
                        return b.Quantity - a.Quantity;
                    })

                });
            }
        });

        res.json({
            customer_id: customer_id,
            products: products
        });
    });

};
