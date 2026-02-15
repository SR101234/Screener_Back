const pool = require('../Utils/SQL.js');

const MFPage = async (req, res) => {
    const { code, month, year } = req.body;
    console.log("Requested Period:", month, year);
    
    let mf_code = null;
    try {
        const [results] = await pool.query(`SELECT Code FROM sharad_static_data.mf_static_data WHERE ISIN = ?;`, [code]);
        if (results.length === 0) return res.status(404).json({ error: 'Fund not found' });
        mf_code = results[0]['Code'];
    } catch (err) {
        console.error('Error fetching MF Code:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    const final_data = {};
    try {
        // --- 1. Fetch Meta Data & Nav ---
        const response = await fetch(`https://dotnet.ngenmarkets.com/ngenindia.asmx/ReturnSQLResult?sql=exec%20c_getFundMetaData%${mf_code}`);
        const data = await response.json();
        final_data['MFName'] = data['meta'][0]['name'];
        final_data['inception'] = data['meta'][0]['inception'].slice(0, 10);
        final_data['fund_manager'] = data['meta'][0]['fund_manager'];
        final_data['ter'] = data['meta'][0]['ter'];
        final_data['exitload'] = data['exitload'][0]['exit_load_remark'];
        final_data['category'] = data['meta'][0]['category'];
    
        const response2 = await fetch(`https://dotnet.ngenmarkets.com/ngenindia.asmx/ReturnSQLResult?sql=exec%20c_getSchemeNavJSON%${mf_code}`);
        const nav = await response2.json();

        final_data['nav'] = nav[nav.length - 1]['nav'];
        final_data['graph'] = nav;
        final_data['change'] = (((nav[nav.length - 1]['nav'] - nav[nav.length - 2]['nav']) / nav[nav.length - 2]['nav']) * 100).toFixed(2);
        
        const inceptionDate = new Date(nav[0]['markDate'].slice(0, 10));
        const latestDate = new Date(nav[nav.length - 1]['markDate'].slice(0, 10));
        const durationYears = (latestDate - inceptionDate) / (1000 * 60 * 60 * 24 * 365.25);

        final_data['cagr'] = ((((nav[nav.length - 1]['nav'] / nav[0]['nav']) ** (1 / durationYears)) - 1) * 100).toFixed(2);

        // --- 2. Calculate Dates for DB Queries ---
        const monthInt = parseInt(month);
        const yearInt = parseInt(year);
        const monthStr = monthInt.toString().padStart(2, '0');
        const monthlyDate = `${monthStr}-${yearInt}`; // Format MM-YYYY

        // Logic for Ratio Quarter Snap (2, 5, 7, 9, 11)
        const quarterMonths = [2, 5, 7, 9, 11];
        let qMonth = quarterMonths.slice().reverse().find(m => m <= monthInt);
        let qYear = yearInt;

        if (!qMonth) {
            qMonth = 11; // Roll back to November
            qYear = yearInt - 1; // Of the previous year
        }
        const quarterlyDate = `${qMonth.toString().padStart(2, '0')}-${qYear}`;

        // --- 3. Monthly History Query ---
        const [response_monthly] = await pool.query(
            `SELECT isin, name, sector, assetClass, perc FROM sharad_screener.mf_holding_history where Code = ? AND markdate = ?;`,
            [mf_code, `${yearInt}-${monthStr}`]
        );
        final_data['asset'] = response_monthly;

        // --- 4. Holdings and Ratios Join Query ---
        try {
            // We use 'monthlyDate' for the holdings table and 'quarterlyDate' for the ratios table
            const [results] = await pool.query(
                `SELECT 
                    m.mf_code, s.ISIN, s.Symbol, s.Company, s.CMP, s.PE, s.ROCE, s.ROE, 
                    s.PromHold, s.Salesvar, s.ProfitVar, s.OPM, s.CROIC, s.Mar_Cap, s.As_on_date 
                 FROM sharad_screener.mf_holdings_data m 
                 JOIN sharad_screener.ratios s ON m.ISIN = s.ISIN 
                 WHERE m.MF_Code = ? 
                   AND m.As_on_date = ? 
                   AND s.As_on_date = ? 
                 ORDER BY m.Per DESC;`, 
                [mf_code, monthlyDate, quarterlyDate]
            );
            
            final_data['heatmap'] = results;
            console.log(`Querying Holdings for ${monthlyDate} and Ratios for ${quarterlyDate}`);
        
        } catch (err) {
            console.error("Database Join Error:", err);
            return res.status(500).json({ error: 'Error joining holdings and ratios' });
        }

        return res.status(200).json(final_data);

    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: e.message });
    }
};

module.exports = { MFPage };