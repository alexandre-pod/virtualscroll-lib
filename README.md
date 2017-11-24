# Virtual-Scroll List

This library provides an easy way to create a list with a virtual scroll, only the visible elements will exist in the DOM. 

## How to use this library

To use this virtual scroll, you have to import the library script in your html with:

```JavaScript
<script src="path/to/virtualScroll.js">
```

To create a list with virtual scroll, here the steps to follow

```html
<div id="listContainer"></div>
```

```JavaScript
function createElement(data, index, dataList) {
	// Your code to generate an HTML element related in the list
	return document.createElement('li');
}

// Your list element
var listElm = document.querySelector('#listContainer');

// Your data related to your list
var dataList = [];

// The height of a line of the list in pixel
var elementHeight = 30;

// The number of elements added to the DOM but outside the visible part of the list
var bufferSize = 0;

// Creation of the virtual scroll, a controller will be returned
var controller = VirtualScroll.create(listElm, dataList, createElement, elementHeight, bufferSize);
```

The function `createElement` will create the DOM element to be added to the list, it will be called at the creation of the list and when you notify the controller that the data has changed.


You can interract with the list with the `controller`returned.

When the data provided to the list has changed, you need to call this method. If 

```JavaScript
// Will recreate the visible elements
controller.onDataUpdate();

// Will update the dataList and recreate the visible elements
controller.onDataUpdate(data);

// Will update the dataList, change  the bufferSize and recreate the visible elements
controller.onDataUpdate(data, bufferSize);
```

To scroll to a specific elements

```JavaScript
controller.scrollToPos(position);
```

When the size of the container is changed, you had to call this method except if this size change is due to a window resize

```JavaScript
controller.onResize();
```

To destroy the virtual scroll, it will remove all the DOM elements created, and will remove all internals listeners. It will also remove the methods from the controller. 

```JavaScript
controller.destroy();
```

## Example

A simple example is presented in the [example.html](example.html) file

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

