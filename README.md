# saft-api 

Start a REST API based on a SAF-T (Portuguese) XML file to easily query its data.

### Remarks
- Use a valid [SAF-T (PT) v1.04_01](http://info.portaldasfinancas.gov.pt/apps/saft-pt04/SAFTPT1.04_01.xsd) XML file
- Demo files in `demo-files`

### Using the tool

```
# Install dependencies
yarn

# Build the src
yarn build

# parse SAFT-T file - checks if valid
#yarn parse -s <file>
yarn parse -s demo-files/SAFT_DEMO_01-01-2018_31-12-2018.xml

# run the server 
yarn serve
```

### Endpoints
 Endpoint | Description
--- | --- 
`/Header` | Company information
`/GeneralLedgerEntries` | Transaction information
`/GeneralLedgerAccounts` | Accounts information
`/Customer` | List of customers
`/Supplier`| List of suppliers
`/Product` | List of products
`/TaxTableEntry` | Tax deduction categories
`/SalesInvoicesInfo` | Aggregated information for invoices
`/SalesInvoices` | List of invoices
`/StockMovementsInfo` | Aggregated informatino for stock movements
`/StockMovements` | List of stock movements

**Note:** created as a helper tool for a university project, not meant for productions apps.

### Contributors
Thanks to
- [@andrefcruz](https://github.com/andrefcruz)
- [@cyrilico](https://github.com/cyrilico)
- [@EdgarACarneiro](https://github.com/edgaracarneiro)
- [@diogotorres97](https://github.com/diogotorres97)
- [@literallysofia](https://github.com/literallysofia)
