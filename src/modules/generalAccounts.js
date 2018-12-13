module.exports = (server, db) => {

    server.get('/GeneralAccounts/GroupingCategory/:filter', (req, res) => {
        let accounts = db.GeneralLedgerAccounts.Account.filter((account) => account.GroupingCategory === req.params.filter);

        res.json(accounts);
    });

    server.get('/GeneralAccounts/AccountID/:filter', (req, res) => {
        let accounts = db.GeneralLedgerAccounts.Account.filter((account) => account.AccountID === req.params.filter);

        res.json(accounts);
    });

    // Sum of credit/debit lines of a single transaction
    function processTransaction(transaction, account_filter, startDate, endDate) {
        function processLine(line, type) {
            if (line.AccountID.indexOf(account_filter) != 0) return 0;
            return type == 'credit' ? Number.parseInt(line.CreditAmount) : Number.parseInt(line.DebitAmount);
        }

        let transactionDate = new Date(transaction.TransactionDate);
        if ((startDate != null && transactionDate < startDate) || (endDate != null && transactionDate > endDate)) {
            return {totalCredit: 0, totalDebit: 0};
        }

        let totalCredit = 0
        let totalDebit = 0
        if (Array.isArray(transaction.Lines.CreditLine)) {
            totalCredit += transaction.Lines.CreditLine.map(line => {
                return processLine(line, 'credit');
            }).reduce((n1, n2) => n1 + n2);
        } else {
            totalCredit += processLine(transaction.Lines.CreditLine, 'credit');
        }

        if (Array.isArray(transaction.Lines.DebitLine)) {
            totalDebit += transaction.Lines.DebitLine.map(line => {
                return processLine(line, 'debit');
            }).reduce((n1, n2) => n1 + n2);
        } else {
            totalDebit += processLine(transaction.Lines.DebitLine, 'debit');
        }

        return {
            totalCredit: totalCredit,
            totalDebit: totalDebit
        }
    }

    // Sum of all General Entries on the given account, between startDate and endDate
    server.get('/AccountSum/:account_id', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;

        let account_id_filter = req.params.account_id;
        let totalCredit = 0;
        let totalDebit = 0;
        db.GeneralLedgerEntries.Journal.forEach(journal => {
            if (Array.isArray(journal.Transaction)) {
                for (let i = 0; i < journal.Transaction.length; i++) {
                    let ret = processTransaction(journal.Transaction[i], account_id_filter, startDate, endDate);
                    totalCredit += ret.totalCredit;
                    totalDebit += ret.totalDebit;
                }
            } else if (journal.Transaction) {
                let ret = processTransaction(journal.Transaction, account_id_filter, startDate, endDate);
                totalCredit += ret.totalCredit;
                totalDebit += ret.totalDebit;
            }
        });
        
        res.json({
            totalCredit: totalCredit,
            totalDebit: totalDebit
        });
    });

};
