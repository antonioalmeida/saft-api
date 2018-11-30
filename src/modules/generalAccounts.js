module.exports = (server, db) => {
    
    server.get('/GeneralAccounts/GroupingCategory/:filter', (req, res) => {
        let accounts = db.GeneralLedgerAccounts.Account.filter((account) => account.GroupingCategory === req.params.filter);
    
        res.json(accounts);
    });
    
};