const pool = require("../Utils/SQL.js");


const Fund_List = async (req,res) => {

    try{
        const [results] = await pool.query(`SELECT ISIN as id, Scheme as name FROM sharad_static_data.mf_static_data;`);
        return res.json(results);
    }
    catch(err){
        console.error('Error fetching fund list:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }



}

module.exports = { Fund_List };