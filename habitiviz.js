/*
Script for Habitiviz.
*/

// global variables
const canvas_width = 500;
const canvas_height = 100;

function date_to_YYYYmmdd(input_date) {
    /*
    Format date object to YYYYmmdd string.
    Input:
        -input_date     Date instance
    Output:
        -output_date    str
    */
    let year = input_date.getUTCFullYear();
    let month = input_date.getUTCMonth() + 1;
    let day = input_date.getDate();
    let output_date =
        ("0000" + year).slice(-4) +
        ("00" + month).slice(-2) +
        ("00" + day).slice(-2);
    return output_date;
}

function read_habitica_history(history_file, graph) {
    /*
    Read data from habitica history files and apply it to a given graph.
    Input:
        -history_file   str
            path to habitica history file
        -graph          Graph instance
    */

    // fetch habitica history data through ajax request
    $.ajax({
        type: "GET",
        url: history_file,
        async: false,
        success: function(history_data) {
            var rows = history_data.split("\n");

            for (var i = 1; i < rows.length - 1; i++) {
                var cols = rows[i].split(",");

                // get this row's task name and performing date
                let task = cols[0];
                let date = new Date(cols[3].slice(0, 10));

                // check if date is already in graph's data array
                let index = graph.data.findIndex(
                    element =>
                        date_to_YYYYmmdd(element.date) == date_to_YYYYmmdd(date)
                );
                if (index == -1) {
                    // if first task found for this date, create a new item in graph's data array
                    graph.data.push({
                        date: date,
                        tasks: [task]
                    });
                } else {
                    // if date already in data array, add new task to this item's tasks list
                    graph.data[index].tasks.push(task);
                }
            }
        }
    });

    // sort graph's data array
    graph.data.sort(sort_graph_data);
    function sort_graph_data(a, b) {
        /*
        See: https://stackoverflow.com/questions/16096872/how-to-sort-2-dimensional-array-by-column-value
        */
        if (a.date === b.date) {
            return 0;
        } else {
            return a.date > b.date ? -1 : 1;
        }
    }
}

class Graph {
    /*
    Class defining a graph.
    */

    constructor() {
        this.cells = [];
        this.cell_size = 8;
        this.cells_spacing = 10;
        this.data = []; // contains for each date in history: Date instance, list of tasks
        this.cols = 50;
    }

    fill_cells() {
        /*
        Read this graph's data and compute cells positions and colors.
        */

        // initiate variables
        let cell_count = 0;
        let week_count = 1;
        let cell_day_of_week;
        let cell_tasks_count;

        while (cell_count < this.data.length - 6 || week_count == 16) {
            // loop through this graph's dates: from most recent day and backwards
            // stop when less than a week is remaining unprocessed or at 4 months

            cell_day_of_week = this.data[cell_count].date.getDay();

            if (cell_day_of_week == 6) {
                week_count += 1; // increase week count every sunday
            }

            cell_tasks_count = this.data[cell_count].tasks.length;

            this.cells.push(
                new Cell(
                    (this.cols - week_count) * this.cells_spacing, // cell x value
                    cell_day_of_week * this.cells_spacing, // cell y value
                    [
                        cell_tasks_count * 10, // cell color
                        cell_tasks_count * 10,
                        cell_tasks_count * 10
                    ]
                )
            );
            cell_count += 1; // increase cells count
        }
    }

    draw(sketch) {
        /*
        Draws this graph on a given sketch.
        Input:
            -sketch     p5js sketch object
        */
        for (let cell of this.cells) {
            sketch.fill(cell.color);
            sketch.square(cell.x, cell.y, this.cell_size);
        }
    }
}

class Cell {
    /*
    Class defining a cell in a graph.
    */

    constructor(x, y, color) {
        /*
        Constructor for the Cell class.
        Input:
            -x      int
            -y      int
            -color  [int, int, int]
        */
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

// creating graph showing total activities
let total_graph = new Graph();
read_habitica_history("./data/habitica-tasks-history.csv", total_graph);
total_graph.fill_cells();

// creating processing sketch
const s = sketch => {
    /*
    Function which takes a "sketch" object as argument and attaches properties such as setup and
    draw functions which are needed for a p5js sketch.
    See: https://github.com/processing/p5.js/wiki/Global-and-instance-mode
    */

    sketch.setup = function() {
        /*
        Processing setup function.
        Called one time at start.
        */
        let canvas = sketch.createCanvas(canvas_width, canvas_height);
        canvas.parent(habitiviz_canvas_div);
    };

    sketch.draw = function() {
        /*
        Processing main loop function.
        */

        // initialisation
        sketch.background(0);
        sketch.noStroke();

        // drawing graph
        total_graph.draw(sketch);
    };
};
let myp5 = new p5(s);
