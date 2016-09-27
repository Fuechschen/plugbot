var S = require('string');

module.exports = function (sequelize, Sequelize) {
    return sequelize.define('Song', {
        id: {type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, unique: true},
        author: {type: Sequelize.STRING, allowNull: true},
        title: {type: Sequelize.STRING, allowNull: true},
        format: {type: Sequelize.INTEGER.UNSIGNED, allowNull: false},
        cid: {type: Sequelize.STRING(20), allowNull: false, unique: true},
        plug_id: {type: Sequelize.INTEGER.UNSIGNED, unique: true, allowNull: false, primaryKey: true},
        duration: {type: Sequelize.INTEGER.UNSIGNED},
        image: {type: Sequelize.STRING},
        is_banned: {type: Sequelize.BOOLEAN, defaultValue: false},
        ban_reason: {type: Sequelize.TEXT},
        tskip: {type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null},
        autovote: {type: Sequelize.ENUM('n', 'w', 'm'), allowNull: false, defaultValue: 'n'}
    }, {
        underscored: true,
        tableName: 'songs'
    });
};