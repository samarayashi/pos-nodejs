let mysql = require('mysql');
let config = require('./config.js');
var pool = mysql.createPool(config.heroku_pool_config);

function sql() {

}

sql.prototype.init_db = function () {
    let stmt = "CREATE TABLE IF NOT EXISTS `simple_transaction` (\
        `transaction_ID` int NOT NULL AUTO_INCREMENT,\
        `transaction_date` datetime NOT NULL,\
        `sheet_num` int NOT NULL,\
        `normal_hot_dog` int NOT NULL DEFAULT '0',\
        `corn_hot_dog` int NOT NULL DEFAULT '0',\
        `french_fries_dog` int NOT NULL DEFAULT '0',\
        `payment_status` int NOT NULL DEFAULT '0',\
        `total_price` int NOT NULL DEFAULT '0', \
        `cancel` int NOT NULL DEFAULT '0', \
        PRIMARY KEY(`transaction_ID`) \
      ) ENGINE = InnoDB AUTO_INCREMENT = 1162 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci; ";

    pool.getConnection(function (err, conn) {
        if (err) {
            return console.log(err.message);
        }
        conn.query(stmt, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
        });
    })

}

sql.prototype.insert_order = function (transaction) {
    let stmt = `INSERT INTO simple_transaction(transaction_date,sheet_num, normal_hot_dog, corn_hot_dog, french_fries_dog,  payment_status, total_price, cancel)
    VALUES(convert_tz(now(), '+00:00', '+08:00') ,?,?,?,?,?,?,?)`;

    pool.getConnection(function (err, conn) {
        if (err) {
            return console.log(err.message);
        }
        conn.query(stmt, transaction, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
            // get inserted id
            console.log('insert transaction_Id:' + results.insertId);
        });
    })
}



sql.prototype.update_payment = function (sheet_num) {
    let stmt = `update simple_transaction set payment_status = 1
            where sheet_num = ? order by transaction_ID desc limit 1;`

    pool.getConnection(function (err, conn) {
        if (err) {
            return console.log(err.message);
        }
        conn.query(stmt, sheet_num, (error, results, fields) => {
            if (error) {
                return console.error(error.message);
            }
            console.log('confirm:' + results.changedRows + 'rows');
        });
        conn.release();
    });
}

sql.prototype.cancel_payment = function (sheet_num) {
    let stmt = `update simple_transaction set cancel = 1
            where sheet_num = ? order by transaction_ID desc limit 1;`

    pool.getConnection(function (err, conn) {
        if (err) {
            return console.log(err.message);
        }
        conn.query(stmt, sheet_num, (error, results, fields) => {
            if (error) {
                return console.error(error.message);
            }
            console.log('cancel:' + results.changedRows + 'rows');
        });
        conn.release();
    });
}

// 時間物件操作參考 https://www.yiibai.com/mysql/today.html
// callback 參考 https://stackoverflow.com/questions/31875621/how-to-properly-return-a-result-from-mysql-with-node
sql.prototype.get_unpayment = function (callback) {
    let stmt = `select sheet_num, total_price, normal_hot_dog, corn_hot_dog ,french_fries_dog from simple_transaction 
            where (date(transaction_date) = date(convert_tz(now(), '+00:00', '+08:00'))) and payment_status = 0 and cancel=0;`

    pool.getConnection(function (err, conn) {
        if (err) {
            return console.log(err.message);
        }
        conn.query(stmt, (error, results, fields) => {
            if (error) {
                return console.error(error.message);
            }
            return callback(results);
        })
        conn.release();
    });
}


sql.prototype.discard_orders = function () {
    let stmt = `update simple_transaction set cancel = 1
            where date(transaction_date) = date(convert_tz(now(), '+00:00', '+08:00')) and payment_status = 0 and cancel = 0`;
    pool.getConnection(function (err, conn) {
        if (err) {
            return console.log(err.message);
        }
        conn.query(stmt, (error, results, fields) => {
            if (error) {
                return console.error(error.message);
            }
            console.log('total discard ' + results.affectedRows + ' orders');
        })
        conn.release();
    });
}

module.exports.sql = sql;


