const pool = require('../Utils/SQL.js');





const table_data = async (req, res) => {


    try {
        // const [results] = await pool.query('SELECT ISIN, MAX(Scheme) AS Scheme, MAX(Category) AS Category, MAX(Asset_Class) AS Asset_Class, MAX(AUM) AS AUM, MAX(PE) AS PE, MAX(NAV) AS NAV, MAX(Equity) AS Equity, MAX(Score) AS Score FROM (SELECT m.ISIN, m.Scheme, m.Category, m.Asset_Class, s.AUM, s.PE, n.NAV, IFNULL(h.Equity, 0) AS Equity, IFNULL(ws.weighted_score, 0) AS Score FROM sharad_static_data.mf_static_data m JOIN sharad_screener.mf_daynamic_data s ON m.ISIN = s.ISIN AND STR_TO_DATE(s.As_on_date, "%m-%Y") = (SELECT MAX(STR_TO_DATE(As_on_date, "%m-%Y")) FROM sharad_screener.mf_daynamic_data) JOIN sharad_screener.nav n ON m.Code = n.Code LEFT JOIN (SELECT mf_code, SUM(per) AS Equity FROM sharad_screener.mf_holdings_data WHERE STR_TO_DATE(As_on_date, "%m-%Y") = (SELECT MAX(STR_TO_DATE(As_on_date, "%m-%Y")) FROM sharad_screener.mf_holdings_data) GROUP BY mf_code) h ON m.Code = h.mf_code LEFT JOIN (SELECT h.mf_code, SUM(h.per * ss.Total)/100 AS weighted_score FROM sharad_screener.mf_holdings_data h JOIN sharad_screener.scoring ss ON h.isin = ss.isin WHERE STR_TO_DATE(h.As_on_date, "%m-%Y") = (SELECT MAX(STR_TO_DATE(As_on_date, "%m-%Y")) FROM sharad_screener.mf_holdings_data) AND STR_TO_DATE(ss.As_on_date, "%m-%Y") = (SELECT MAX(STR_TO_DATE(As_on_date, "%m-%Y")) FROM sharad_screener.scoring) GROUP BY h.mf_code) ws ON m.Code = ws.mf_code) t GROUP BY ISIN;');
        const [results] = await pool.query('SELECT t.ISIN, t.ISIN, t.Scheme, t.Category, t.Asset_Class, t.AUM, t.PE, n.NAV, t.Equity, t.Score FROM sharad_screener.mf_table t LEFT JOIN sharad_screener.nav n ON t.ISIN = n.ISIN WHERE t.Generation = (SELECT MAX(Generation) FROM sharad_screener.mf_table);');
        res.status(200).json(results);
    } catch (err) {
        console.log('Error fetching table data:', err);
        console.error('Error fetching heatmap data:', err);
        res.status(500).json({ error: err });
    }



    // try{

    //     const data = req.body;
    //     const mongolist = await NAV_Data.findById('68e80cbc3f62f75fe622e663');


    //     var newData = {};

    //     const current_Time = new Date();
    //     const prev_date = new Date(mongolist.toObject()['time']);
    //     const diff = (current_Time - prev_date) / (1000 * 60 * 60);
    //     // console.log(diff);

    //     if (diff >= 24) {


    //         for (code in data) {

    //             try {
    //                 const response = await fetch(`https://dotnet.ngenmarkets.com/ngenindia.asmx/ReturnSQLResult?sql=exec%20c_getSchemeNavJSON%${code}`).then((res) => res.json());
    //                 newData[code] = response?.[response.length - 1]?.nav || "N/A";
    //             }
    //             catch (e) {
    //                 return res.status(400).send(error);
    //             }

    //         }
    //         const current_date = new Date();
    //         const m = current_date.getMonth();
    //         const d = current_date.getDate();
    //         const y = current_date.getFullYear();
    //         newData['time'] = new Date(y, m, d, 1, 0, 0);
    //         const doc = await NAV_Data.findByIdAndUpdate(
    //             '68e80cbc3f62f75fe622e663',newData,
    //             {new: true,
    //                 overwrite: true,
    //             });

    //             return res.status(200).json(newData);


    //         }
    //         else {
    //             try {
    //                 for (let code in data) {
    //                     // console.log(code);
    //                     if (mongolist.toObject()[code] !==undefined ) {
    //                         newData[code] = mongolist.toObject()[code];
    //                     }
    //                     else {
    //                         const response = await fetch(`https://dotnet.ngenmarkets.com/ngenindia.asmx/ReturnSQLResult?sql=exec%20c_getSchemeNavJSON%${code}`).then((res) => res.json());
    //                         newData[code] = response?.[response.length - 1]?.nav || "N/A";

    //                     }

    //                 }

    //                 try {
    //                     const doc = await NAV_Data.findByIdAndUpdate(
    //                         '68e80cbc3f62f75fe622e663',newData,
    //                         {new: true,
    //                             overwrite: true,
    //                         });


    //                     }
    //                     catch (e) {
    //                         console.log(e);
    //                     }


    //                     return res.status(200).json(newData);

    //                 }
    //                 catch (e) {
    //                     return res.status(400).json(e);
    //                 }




    //             }
    //         }
    //         catch(e){
    //             return res.status(500).json(e);
    //         }




}

const get_table_data = async (req,res) => {  
    
    try {
        const [results] = await pool.query('SELECT ISIN,Scheme FROM sharad_static_data.mf_static_data;');
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching heatmap data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = { table_data, get_table_data }; 