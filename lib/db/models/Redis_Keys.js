module.exports = function (sequelize, Sequelize) {
    return sequelize.define("Redis_Key", {
        key: {type: Sequelize.STRING(191), unique: true, primaryKey: true, allowNull: false},
        type: {
            type: Sequelize.ENUM('string', 'hash', 'list', 'set', 'sorted_set'),
            defaultValue: 'string',
            allowNull: false
        },
        data: {type: Sequelize.TEXT, allowNull: true, defaultValue: null},
        expires: {type: Sequelize.DATE, allowNull: true, defaultValue: null}
    }, {
        underscored: true,
        tableName: 'redis_keys'
    })
};