module.exports = function(sequelize, Sequelize) {
    return sequelize.define("CustomCommand", {
        id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, unique: true},
        trigger: {type: Sequelize.STRING, allowNull: false},
        message: {type: Sequelize.STRING, allowNull: false},
        status: {type: Sequelize.BOOLEAN, defaultValue: true}
    }, {
        underscored: true,
        tableName: 'customcommands'
    })
};