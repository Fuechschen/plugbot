module.exports = (sequelize, Sequelize) => sequelize.define('Play', {
    id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, unique: true},
    woots: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    grabs: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    mehs: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    listeners: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    time: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
    skipped: {type: Sequelize.BOOLEAN, defaultValue: false}
}, {
    underscored: true,
    tableName: 'plays'
});