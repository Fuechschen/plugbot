module.exports = function (sequelize, Sequelize) {
    return sequelize.define("Hash_Element", {
        key: {type: Sequelize.STRING(191), defaultValue: 0, allowNull: false},
        data: {type: Sequelize.TEXT, allowNull: false}
    }, {
        underscored: true,
        tableName: 'redis_hash_element'
    })
};