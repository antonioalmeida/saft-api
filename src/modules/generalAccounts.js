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
            return {
                totalCredit: 0,
                totalDebit: 0
            };
        }

        let totalCredit = 0
        let totalDebit = 0
        if (transaction.Lines.CreditLine && Array.isArray(transaction.Lines.CreditLine)) {
            totalCredit += transaction.Lines.CreditLine.map(line => {
                return processLine(line, 'credit');
            }).reduce((n1, n2) => n1 + n2);
        } else if (transaction.Lines.CreditLine) {
            totalCredit += processLine(transaction.Lines.CreditLine, 'credit');
        }
        
        if (transaction.Lines.DebitLine && Array.isArray(transaction.Lines.DebitLine)) {
            totalDebit += transaction.Lines.DebitLine.map(line => {
                return processLine(line, 'debit');
            }).reduce((n1, n2) => n1 + n2);
        } else if (transaction.Lines.DebitLine) {
            totalDebit += processLine(transaction.Lines.DebitLine, 'debit');
        }

        return {
            totalCredit: totalCredit,
            totalDebit: totalDebit
        }
    }

    function accountSumBetweenDates(account_id_filter, startDate, endDate) {
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

        return ({
            totalCredit: totalCredit,
            totalDebit: totalDebit
        });
    }

    // Sum of all General Entries on the given account, between startDate and endDate
    server.get('/AccountSum/:account_id', (req, res) => {
        let startDate = 'start-date' in req.query ? new Date(req.query['start-date']) : null;
        let endDate = 'end-date' in req.query ? new Date(req.query['end-date']) : null;
        let account_id_filter = req.params.account_id;

        res.json(accountSumBetweenDates(account_id_filter, startDate, endDate));
    });

    // Sum of all General Entries on the given account by Month
    server.get('/AccountSumByMonth/:account_id', (req, res) => {
        let account_id_filter = req.params.account_id;
        let accountSumByMonth = {};

        for (let i = 1; i <= 12; i++) {
            let date = db.Header.FiscalYear + '-' + i;
            accountSumByMonth[i] = accountSumBetweenDates(account_id_filter, new Date(date + "-01"), new Date(date + "-31"));
        }

        res.json(accountSumByMonth);

    });

    server.get('/GeneralAccounts/BalanceSheet', (req, res) => {
        let balanceSheet = {
            'assets': {
                'Ativo não corrente': {
                    'Ativos fixos tangíveis': 0, //43+453+455-459 ✓
                    'Propriedades de investimento': 0, //42+455+452-459 ✓
                    'Ativos intangíveis': 0, //44+454+455-459 ✓
                    'Investimentos financeiros': 0, //41 ✓
                    'Accionistas/Sócios': 0 //266 + 268 - 269 ✓
                },
                'Ativo corrente': {
                    'Inventários': 0, //32+33+34+35+36+39 ✓
                    'Clientes': 0, //21 ✓
                    'Adiantamentos a fornecedores': 0, //228-229+2713-279 ✓
                    'Estado e outros entes públicos': 0, //24 ✓
                    'Accioninistas/Sócios': 0, //263+268-269 ✓
                    'Outras Contas a Receber': 0, //232+238-239+2721+278-279 ✓
                    'Diferimentos': 0, //281 ✓
                    'Outros ativos financeiros': 0, //14 ✓
                    'Caixa e depósitos bancários': 0 // 11+12+13 ✓
                },
                'Total do ativo': 0,
            },

                'equity': {
                    'Capital próprio': {
                        'Capital Realizado': 0, //51-261-262 ✓
                        'Acções (quotas) próprias': 0, //52 ✓
                        'Outros instrumentos de capital próprio': 0, //53 ✓
                        'Prémios de emissão': 0, //54 ✓
                        'Reservas legais': 0, //551 ✓
                        'Outras reservas': 0, //552 ✓
                        'Resultados transitados': 0, //56 ✓
                        'Excedentes de revalorização': 0, //58 ✓
                        'Outras variações no capital próprio': 0, //59 ✓
                        'Resultado líquido do período': 0 //818 ✓
                    },
                    'Total do Capital Próprio': 0,
                },
                'liabilities': {
                    'Passivo não corrente': {
                        'Provisões': 0, //29 ✓
                        'Financiamentos obtidos': 0, //25 ✓
                        'Outras contas a pagar': 0 //237+2711+2712+275 ✓
                    },
                    'Passivo corrente': {
                        'Fornecedores': 0, //221+222+225 ✓
                        'Adiantamentos de clientes': 0, //218+276 ✓
                        'Estado e outros entes públicos': 0, //24 ✓
                        'Accionistas/Sócios': 0, //264+265+268 ✓
                        'Financiamentos obtidos': 0, //25 ✓
                        'Outras contas a pagar': 0, //231+238+2711+2712+2722+278 ✓
                        'Diferimentos': 0, //282+283
                        'Outros passivos financeiros': 0 //14 ✓
                    },
                    'Total do Passivo': 0,
                },
                'Total do Capital Próprio e do Passivo': 0
            
        };

        db.GeneralLedgerAccounts.Account.forEach(account => {
            const accountID = account.AccountID;
            const saldoConta = parseFloat(account.ClosingDebitBalance - account.ClosingCreditBalance);

            switch (accountID) {
                case '11':
                case '12':
                case '13':
                    balanceSheet.assets["Ativo corrente"]["Caixa e depósitos bancários"] += saldoConta;
                    break;
                case '14':
                    {
                        if (saldoConta >= 0)
                            balanceSheet.assets["Ativo corrente"]["Outros ativos financeiros"] += saldoConta;
                        else
                            balanceSheet.liabilities["Passivo corrente"]["Outros passivos financeiros"] += Math.abs(saldoConta);
                    }
                    break;
                case '21':
                    balanceSheet.assets["Ativo corrente"].Clientes += saldoConta;
                    break;
                case '218':
                case '276':
                    balanceSheet.liabilities["Passivo corrente"]["Adiantamentos de clientes"] += Math.abs(saldoConta);
                    break;
                case '221':
                case '222':
                case '225':
                    balanceSheet.liabilities["Passivo corrente"].Fornecedores += Math.abs(saldoConta);
                    break;
                case '228':
                case '2713':
                    balanceSheet.assets["Ativo corrente"]["Adiantamentos a fornecedores"] += saldoConta;
                    break;
                case '229':
                case '279':
                    {
                        balanceSheet.assets["Ativo corrente"]["Adiantamentos a fornecedores"] -= saldoConta;
                        balanceSheet.assets["Ativo corrente"]["Outras Contas a Receber"] -= saldoConta;
                    }
                    break;
                case '231':
                case '238':
                case '2722':
                    balanceSheet.liabilities["Passivo corrente"]["Outras contas a pagar"] += Math.abs(saldoConta);
                    break;
                case '232':
                case '238':
                case '2721':
                    balanceSheet.assets["Ativo corrente"]["Outras Contas a Receber"] += saldoConta;
                    break;
                case '237':
                case '275':
                    balanceSheet.liabilities["Passivo não corrente"]["Outras contas a pagar"] += Math.abs(saldoConta);
                    break;
                case '239':
                    balanceSheet.assets["Ativo corrente"]["Outras Contas a Receber"] -= saldoConta;
                    break;
                case '2432':
                case '2437':
                case '2438':
                    balanceSheet.assets["Ativo corrente"]["Estado e outros entes públicos"] += saldoConta;
                    break;
                case '2433':
                    balanceSheet.liabilities["Passivo corrente"]["Estado e outros entes públicos"] += Math.abs(saldoConta);
                    break;
                case '25':
                    {
                        balanceSheet.liabilities["Passivo não corrente"]["Financiamentos obtidos"] += Math.abs(saldoConta);
                        balanceSheet.liabilities["Passivo corrente"]["Financiamentos obtidos"] += Math.abs(saldoConta);
                    }
                    break;
                case '261':
                case '262':
                    balanceSheet.equity["Capital próprio"]["Capital Realizado"] -= saldoConta;
                    break;
                case '263':
                    balanceSheet.assets["Ativo corrente"]["Accioninistas/Sócios"] += saldoConta;
                    break;
                case '264':
                case '265':
                    balanceSheet.liabilities["Passivo corrente"]["Accionistas/Sócios"] += Math.abs(saldoConta);
                case '266':
                case '268':
                    {
                        if (saldoConta > 0)
                            balanceSheet.assets["Ativo corrente"]["Accioninistas/Sócios"] += saldoConta;
                        else
                            balanceSheet.liabilities["Passivo corrente"]["Accionistas/Sócios"] += Math.abs(saldoConta);
                    }
                    break;
                case '269':
                    {
                        balanceSheet.assets["Ativo não corrente"]["Accionistas/Sócios"] -= saldoConta;
                        balanceSheet.assets["Ativo corrente"]["Accioninistas/Sócios"] -= saldoConta;
                    }
                    break;
                case '2711':
                case '2712':
                    {
                        balanceSheet.liabilities["Passivo não corrente"]["Outras contas a pagar"] += Math.abs(saldoConta);
                        balanceSheet.liabilities["Passivo corrente"]["Outras contas a pagar"] += Math.abs(saldoConta);
                    }
                    break;
                case '278':
                    {
                        if (saldoConta >= 0)
                            balanceSheet.assets["Ativo corrente"]["Outras Contas a Receber"] += saldoConta;
                        else
                            balanceSheet.liabilities["Passivo corrente"]["Outras contas a pagar"] += Math.abs(saldoConta);
                    }
                    break;
                case '281':
                    balanceSheet.assets["Ativo corrente"].Diferimentos += saldoConta;
                    break;
                case '282':
                case '283':
                    balanceSheet.liabilities["Passivo corrente"].Diferimentos += Math.abs(saldoConta);
                    break;
                case '29':
                    balanceSheet.liabilities["Passivo não corrente"].Provisões += Math.abs(saldoConta);
                    break;
                case '32':
                case '33':
                case '34':
                case '35':
                case '36':
                case '39':
                    balanceSheet.assets["Ativo corrente"].Inventários += saldoConta;
                    break;
                case '41':
                    balanceSheet.assets["Ativo não corrente"]["Investimentos financeiros"] += saldoConta;
                    break;

                case '42':
                case '452':
                case '455':
                    balanceSheet.assets["Ativo não corrente"]["Propriedades de investimento"] += saldoConta;
                    break;
                case '43':
                case '453':
                case '455':
                    balanceSheet.assets["Ativo não corrente"]["Ativos fixos tangíveis"] += saldoConta;
                    break;
                case '44':
                case '454':
                case '455':
                    balanceSheet.assets["Ativo não corrente"]["Ativos intangíveis"] += saldoConta;
                    break;
                case '459':
                    {
                        balanceSheet.assets["Ativo não corrente"]["Ativos fixos tangíveis"] -= saldoConta;
                        balanceSheet.assets["Ativo não corrente"]["Propriedades de investimento"] -= saldoConta;
                        balanceSheet.assets["Ativo não corrente"]["Ativos intangíveis"] -= saldoConta;
                    }
                    break;
                case '51':
                    balanceSheet.equity["Capital próprio"]["Capital Realizado"] += saldoConta;
                    break;
                case '52':
                    balanceSheet.equity["Capital próprio"]["Acções (quotas) próprias"] += saldoConta;
                    break;
                case '53':
                    balanceSheet.equity["Capital próprio"]["Outros instrumentos de capital próprio"] += saldoConta;
                    break;
                case '54':
                    balanceSheet.equity["Capital próprio"]["Prémios de emissão"] += saldoConta;
                    break;
                case '551':
                    balanceSheet.equity["Capital próprio"]["Reservas legais"] += saldoConta;
                    break;
                case '552':
                    balanceSheet.equity["Capital próprio"]["Outras reservas"] += saldoConta;
                    break;
                case '56':
                    balanceSheet.equity["Capital próprio"]["Resultados transitados"] += saldoConta;
                    break;
                case '58':
                    balanceSheet.equity["Capital próprio"]["Excedentes de revalorização"] += saldoConta;
                    break;
                case '59':
                    balanceSheet.equity["Capital próprio"]["Outras variações no capital próprio"] += saldoConta;
                    break;
                case '71':
                case '72':
                    balanceSheet.equity["Capital próprio"]["Resultado líquido do período"] += Math.abs(saldoConta);
                    break;
                case '61':
                case '62':
                case '31':
                    balanceSheet.equity["Capital próprio"]["Resultado líquido do período"] -= Math.abs(saldoConta);
                    break;
                default:
                    break;
            }

        });
        
        //totals
        balanceSheet.assets["Total do ativo"] += getParcelSum(balanceSheet.assets["Ativo corrente"]);
        balanceSheet.assets["Total do ativo"] += getParcelSum(balanceSheet.assets["Ativo não corrente"]);
        balanceSheet.liabilities["Total do Passivo"] += getParcelSum(balanceSheet.liabilities["Passivo corrente"]);
        balanceSheet.liabilities["Total do Passivo"] += getParcelSum(balanceSheet.liabilities["Passivo não corrente"]);
        balanceSheet.equity["Total do Capital Próprio"] = getParcelSum(balanceSheet.equity["Capital próprio"]);
        balanceSheet["Total do Capital Próprio e do Passivo"] = balanceSheet.liabilities["Total do Passivo"] + balanceSheet.equity["Total do Capital Próprio"];

        function getParcelSum(vals) {
            return Object.keys(vals)
                .reduce(function (sum, key) {
                    return sum + vals[key]
                }, 0);
        }

        let assets = Object.entries(balanceSheet.assets).map((elem, index) => {
            return {
                name: elem[0],
                values: elem[1] instanceof Object ? Object.entries(elem[1]) : elem[1]
            }
        })

        let equity = Object.entries(balanceSheet.equity).map((elem, index) => {
            return {
                name: elem[0],
                values: elem[1] instanceof Object ? Object.entries(elem[1]) : elem[1]
            }
        })

        let liabilities = Object.entries(balanceSheet.liabilities).map((elem, index) => {
            return {
                name: elem[0],
                values: elem[1] instanceof Object ? Object.entries(elem[1]) : elem[1]
            }
        })

        res.json({
            assets: assets,

            equity: equity,

            liabilities: liabilities,

            totalEquityAndLiabilities: balanceSheet['Total do Capital Próprio e do Passivo']
        });
    });

};