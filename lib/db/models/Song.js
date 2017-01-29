module.exports = (sequelize, Sequelize) => sequelize.define('Song', {
    id: {type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, unique: true},
    author: {type: Sequelize.STRING, allowNull: true},
    title: {type: Sequelize.STRING, allowNull: true},
    format: {type: Sequelize.INTEGER.UNSIGNED, allowNull: false},
    cid: {type: Sequelize.STRING(20), allowNull: false, unique: true},
    plugId: {type: Sequelize.INTEGER.UNSIGNED, unique: true, allowNull: false, primaryKey: true, field: 'plug_id'},
    duration: {type: Sequelize.INTEGER.UNSIGNED},
    image: {type: Sequelize.STRING},
    isBanned: {type: Sequelize.BOOLEAN, defaultValue: false, field: 'is_banned'},
    banReason: {type: Sequelize.TEXT, field: 'ban_reason'},
    tskip: {type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null},
    autovote: {type: Sequelize.ENUM('n', 'w', 'm'), allowNull: false, defaultValue: 'n'}
}, {
    underscored: true,
    tableName: 'songs'
});