module.exports = function (sequelize, Sequelize) {
    return sequelize.define("Sorted_Set_Element", {
        weigth: {type: Sequelize.INTEGER, defaultValue: 0, allowNull: false},
        data: {type: Sequelize.TEXT, allowNull: false}
    }, {
        underscored: true,
        tableName: 'redis_sorted_set_element'
    })
};