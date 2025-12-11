const pool = require('../Utils/SQL.js');


const MFPage = async (req, res) => {

    const { code } = req.body;
    let mf_code = null;
    try {
        const [results] = await pool.query(`SELECT Code FROM sharad_static_data.mf_static_data WHERE ISIN = "${code}";`);
        
        mf_code = results[0]['Code'];
    } catch (err) {
        console.error('Error fetching heatmap data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
    const final_data = {};
    try {
        
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
        const diffInMs = latestDate - inceptionDate;
        const years = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
        const durationYears = years.toFixed(2);
       

        final_data['cagr'] = ((((nav[nav.length - 1]['nav'] / nav[0]['nav']) ** (1 / durationYears)) - 1) * 100).toFixed(2);

        const response3 = await fetch(`https://dotnet.ngenmarkets.com/ngenindia.asmx/ReturnSQLResult?sql=exec%20c_getLatestHoldings%${mf_code},1`);
        const stocks = await response3.json();
        final_data['asset'] = stocks;
        
        try {
            const [results] = await pool.query(`SELECT m.mf_code, s.ISIN, s.Symbol, s.Company, s.CMP, s.PE, s.ROCE, s.ROE, s.PromHold, s.Salesvar, s.ProfitVar, s.OPM, s.CROIC, s.Mar_Cap, s.As_on_date FROM sharad_screener.mf_holdings_data m JOIN sharad_screener.ratios s ON m.ISIN = s.ISIN WHERE m.MF_Code=${mf_code} AND STR_TO_DATE(m.As_on_date, '%m-%Y') = (SELECT MAX(STR_TO_DATE(As_on_date, '%m-%Y')) FROM sharad_screener.mf_holdings_data) AND STR_TO_DATE(s.As_on_date, '%m-%Y') = (SELECT MAX(STR_TO_DATE(As_on_date, '%m-%Y')) FROM sharad_screener.ratios) ORDER BY m.Per DESC;
`);
            final_data['heatmap'] = results;
        } catch (err) {
            console.error('Error fetching heatmap data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }

        // const filePath = path.join(__dirname, "data", "isin_to_screener.json");
        // const stock_codes_fetch = await fs.readFile(filePath, "utf-8");
        // const stock_codes = JSON.parse(stock_codes_fetch);



        // const selected_stocks = [];
        // for (let i = 0; i < stocks.length; i++) {

        //     try {

        //         if(!stock_codes[stocks[i]['isin']]) continue;

        //         selected_stocks.push(stock_codes[stocks[i]['isin']]);
        //         // selected_stocks[stocks[i]['isin']] = stock_codes[stocks[i]['isin']];

        //     }
        //     catch (e) {
        //         continue;
        //     }


        // }

        // final_data['selected_stock'] = selected_stocks;


        return res.status(200).json(final_data);


    }
    catch (e) {
        return res.status(500).json({ message: e });
    }







}

module.exports = { MFPage };