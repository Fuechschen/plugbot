module.exports = (sequelize, Sequelize) => sequelize.define("CustomCommand", {
    id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, unique: true, autoIncrement: true},
    trigger: {type: Sequelize.STRING(191), allowNull: false, unique: true},
    message: {type: Sequelize.STRING, allowNull: false},
    status: {type: Sequelize.BOOLEAN, defaultValue: true},
    senderinfo: {type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false},
    allowMention: {type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false}
}, {
    underscored: true,
    tableName: 'customcommands'
});