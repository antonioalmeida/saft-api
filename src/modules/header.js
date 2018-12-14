module.exports = (server, db) => {

    server.get('/header/fiscal-year', (req, res) => {
       res.json(db.Header.FiscalYear);
    });
}