module.exports = (sequelize, Sequelize) => sequelize.define('Song', {
    id: {type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, unique: true},
    name: {type: Sequelize.STRING, allowNull: true},
    cid: {type: Sequelize.STRING(161), allowNull: true, primaryKey: true, unique: true},
    isBanned: {type: Sequelize.BOOLEAN, defaultValue: false,field:'is_banned'},
    banReason: {type: Sequelize.TEXT,field:'ban_reason'}
}, {
    underscored: true,
    tableName: 'channels'
});