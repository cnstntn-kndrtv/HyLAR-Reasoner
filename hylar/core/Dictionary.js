/**
 * Created by Spadon on 13/11/2015.
 */

/**
 * Dictionary used to index triples (in turtle) and their fact representation.
 * @type {{substractFactSets: Function, mergeFactSets: Function}|exports|module.exports}
 */

var Logics = require('./Logics/Logics');
var Utils = require('./Utils');
var ParsingInterface = require('./ParsingInterface');

var dict = {
};

module.exports = {
    /**
     * Returns the fact corresponding to the turtle triple.
     * @param ttl
     * @returns {*}
     */
    get: function(ttl) {
        var fact = dict[ttl];
        if (fact) return fact;
        else return false;
    },

    /**
     * Updates the fact representation of
     * an existing turtle triple, or puts
     * a new one by transform the fact into turtle
     * through the ParsingInterface.
     * @param fact
     * @returns {*}
     */
    put: function(fact) {
        for (var key in dict) {
            var value = dict[key];
            if(fact.equivalentTo(value)) {
                dict[key] = Logics.mergeFacts(fact, value);
                return true;
            }
        }
        try {
            dict[ParsingInterface.factToTurtle(fact)] = fact;
            return true;
        } catch(e) {
            return e;
        }
    },

    /**
     * Return the full content of the dictionary.
     * @returns {Object}
     */
    content: function() {
        return dict;
    },

    /**
     * Sets dictionary's content.
     * @param content Object
     */
    setContent: function(content) {
        dict = content;
    },

    /**
     * Gets all facts from the dictionary.
     * @returns {Array}
     */
    values: function() {
        var values = [];
        for (var key in dict) {
            values.push(dict[key]);
        }
        return values;
    },

    /**
     * Gets facts corresponding to the turtle triples,returns an object
     * {found: facts found, notfound: turtle triples with no repr.}
     * @param triples An array of turtle triples.
     * @returns {{found: Array, notfound: Array}}
     */
    findValues: function(triples) {
        var values = [], notfound = [],
            value;
        for (var i = 0; i < triples.length; i++) {
            value = dict[triples[i].toString().slice(0, -2)];
            if(value !== undefined) {
               values.push(value);
            } else {
               notfound.push(triples[i]);
            }
        }
        return {
            found: values,
            notfound: notfound
        };
    },

    /**
     * Gets turtle triples corresponding to the facts,returns an object
     * {found: triples found, notfound: facts repr. nothing.}
     * @param values
     * @returns {{found: Array, notfound: Array}}
     */
    findKeys: function(values) {
        var keys = [], value, notfound = [];
        for (var i = 0; i< values.length; i++) {
            value = values[i];
            var key = Utils.getKeyByValue(dict, value);
            if(key !== undefined) {
                keys.push(key)
            } else {
                notfound.push(value);
            }
        }
        return {
            found: keys,
            notfound: notfound
        };
    }
};