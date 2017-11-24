(function(window) {

	window.VirtualScroll = {};

	window.VirtualScroll.create = create;
	/**
	 * Initiate the virtual scroll list and create a controller for it
	 * 
	 * @param  {DOMElement} listElm            The element where the list will be displayed. Needs to have a height set, can be updated with controller
	 * @param  {Array} dataList                data given to createFunction
	 * @param  {function} createElement        Create an element if data correct, return null else.
	 *                                         		It is called with the data from dataList, the position in the list and the dataList
	 *                                         		Ex: createElement(dataList[i], i, dataList)
	 * @param  {Number} elementHeight          The height of list item. Needs to be fixed, else the items will overlapse
	 * @param  [Number] hiddenBufferedElements The number of elements not visible that will be keep for less data update
	 * @return {Object}                        Return a controller for the virtualScroll
	 */
	function create(listElm, dataList, createElement, elementHeight, hiddenBufferedElements) {
		var divContainer = document.createElement('div');
		divContainer.style.position = 'relative';
		divContainer.style.overflow = 'hidden';
		listElm.appendChild(divContainer);

		var lastListElmHeight = listElm.clientHeight;
		var displayedElements = 1 + Math.ceil(listElm.clientHeight / elementHeight);
		if(hiddenBufferedElements && hiddenBufferedElements < 0) throw new Error('the argument hiddenBufferedElements needs to be a positive or null integer if given');
		var outsideElements = hiddenBufferedElements || 0;
		var neededElements = displayedElements + outsideElements;

		var elementsArray = new Array(neededElements);
		var arrayPointer = 0;

		var scrollTop = 0;
		var maxScrollTop;

		var firstIndexDisplayed, lastIndexDisplayed;

		listElm.addEventListener('scroll', onScrollUpdate);
		window.addEventListener('resize', onWindowResize);
		onDataUpdate();

		var controller = {};

		/* API Methods for the controller */
		/**
		 * This function update the list data.
		 * When the data array is updated, a call to this function is needed to refresh the list elements
		 * 
		 * 
		 * @param {Array} [data]					if provided update the array used for data access
		 * @param {Number} [hiddenBufferedElements] if provided update the size of the hiddenBuffer, needs to be positive
		 */
		controller.onDataUpdate = onDataUpdate;

		/**
		 * Scroll the list to the element at position `position`
		 *
		 * @param {Nnumber} position
		 */
		controller.scrollToPos = scrollToPos;

		/**
		 * When the size of the list is changed, a call to this method is needed to refresh the amount of displayed elements
		 * This method is automaticly called when the window is resized
		 */
		controller.onResize = onWindowResize;

		/**
		 * Destroy the virtual scroll list
		 */
		controller.destroy = destroy;

		/* END API Methods */


		return controller;


		function destroy() {
			divContainer.remove();
			listElm.removeEventListener('scroll', onScrollUpdate);
			window.removeEventListener('resize', onWindowResize);
			controller.onDataUpdate = undefined;
			controller.scrollToPos = undefined;
			controller.onResize = undefined;
			controller.destroy = undefined;
		}

		function onDataUpdate(data, hiddenBufferedElements) {
			if(hiddenBufferedElements !== undefined) {
				if(hiddenBufferedElements < 0) throw new Error('the argument hiddenBufferedElements needs to be a positive or null integer if given');
				outsideElements = hiddenBufferedElements || 0;
				neededElements = displayedElements + outsideElements;
				elementsArray = new Array(neededElements);
				arrayPointer = 0;				
			}

			dataList = data!==undefined ? data : dataList;
			divContainer.style.height = elementHeight * dataList.length + 'px';

			maxScrollTop = divContainer.clientHeight - listElm.clientHeight - elementHeight;
			maxScrollTop = maxScrollTop>0 ? maxScrollTop : 0;
			if (listElm.scrollTop >= maxScrollTop) {
				scrollTop = maxScrollTop;
			}

			refreshAllData();
		}

		function onWindowResize() {
			if(lastListElmHeight == listElm.clientHeight) return;

			lastListElmHeight = listElm.clientHeight;

			maxScrollTop = divContainer.clientHeight - listElm.clientHeight - elementHeight;
			maxScrollTop = maxScrollTop>0 ? maxScrollTop : 0;
			if (listElm.scrollTop >= maxScrollTop) {
				scrollTop = maxScrollTop;
			}
			displayedElements = 1 + Math.ceil(listElm.clientHeight / elementHeight);
			outsideElements = hiddenBufferedElements || (displayedElements<<1);
			neededElements = displayedElements + outsideElements;

			clearElements();

			elementsArray = new Array(neededElements);
			arrayPointer = 0;
			refreshAllData();
		}

		function onScrollUpdate() {
			scrollTop = listElm.scrollTop;
			if (scrollTop < 0) scrollTop = 0;
			else if (scrollTop >= maxScrollTop) scrollTop = maxScrollTop;

			var firstVisible = Math.floor(scrollTop/elementHeight);
			var lastVisible = firstVisible + displayedElements-1;

			if(firstVisible < firstIndexDisplayed || lastVisible > lastIndexDisplayed) {
				displayDataFrom(firstVisible);
			}

			return;
		}

		function displayDataFrom(indexVisibleFrom) {
			var toUpdate = 0;
			var indexVisibleTo = indexVisibleFrom + displayedElements-1;
			if (indexVisibleFrom < firstIndexDisplayed) {
				toUpdate -= firstIndexDisplayed - indexVisibleFrom + (outsideElements>>1);
			} else if (indexVisibleTo > lastIndexDisplayed) {
				toUpdate += indexVisibleTo - lastIndexDisplayed + (outsideElements>>1);
			} else return;

			if(toUpdate >= neededElements || -toUpdate >= neededElements) {
				return refreshAllData();
			}

			var i, pos;
			if(toUpdate > 0) {
				for(i=0, pos=lastIndexDisplayed+1 ; i<toUpdate ; i++, pos++) {
					elm = createElement(dataList[pos], pos, dataList);
					addDataElementAfter(elm, pos*elementHeight);
				}
			} else {
				for(i=0, pos=firstIndexDisplayed-1 ; i<-toUpdate ; i++, pos--) {
					elm = createElement(dataList[pos], pos, dataList);
					addDataElementBefore(elm, pos*elementHeight);
				}
			}

			firstIndexDisplayed += toUpdate;
			lastIndexDisplayed += toUpdate;
		}

		function refreshAllData() {
			var from = Math.floor(scrollTop/elementHeight) - (outsideElements>>1);
			var i=0, elm;

			firstIndexDisplayed = from;
			lastIndexDisplayed = from + neededElements-1;

			clearElements();

			for(var length = dataList.length, fromTop = from*elementHeight ;
				i<neededElements && from<length ;
				i++, from++, fromTop+=elementHeight)
			{
				elm = createElement(dataList[from], from, dataList);
				addDataElementAfter(elm, fromTop);
			}

		}

		function addDataElementAfter(elm, fromTop) {
			if(elm) {
				elm.style.position = 'absolute';
				elm.style.top = fromTop + 'px';
				var old = elementsArray[arrayPointer];
				if(old) {
					divContainer.replaceChild(elm, old);
				}else {
					divContainer.appendChild(elm);
				}
			} else if(elementsArray[arrayPointer]) {
				elementsArray[arrayPointer].remove();	
			}
			elementsArray[arrayPointer] = elm;
			arrayPointer = (arrayPointer+1) % elementsArray.length;
		}

		function addDataElementBefore(elm, fromTop) {
			if(arrayPointer===0) arrayPointer=elementsArray.length-1;
			else arrayPointer -= 1;
			if(elm) {
				elm.style.position = 'absolute';
				elm.style.top = fromTop + 'px';

				var old = elementsArray[arrayPointer];
				if(old) {
					divContainer.replaceChild(elm, old);
				}else {
					divContainer.appendChild(elm);
				}
			} else if(elementsArray[arrayPointer]) {
				elementsArray[arrayPointer].remove();	
			}
			elementsArray[arrayPointer] = elm;
		}

		function clearElements() {
			for(var i=0 ; i<elementsArray.length ; i++) {
				if(!elementsArray[i]) continue;
				elementsArray[i].remove();
				elementsArray[i] = null;
			}
		}

		function scrollToPos(position) {
			listElm.scrollTop = position * elementHeight;
		}
	}
})(window);
