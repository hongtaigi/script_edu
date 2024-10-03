var ssTimeout = 240;
if(document.domain == 'ncp.acrc.go.kr' || document.domain == 'www.clean.go.kr' || document.domain == 'clean.go.kr') ssTimeout = 30;

var Fn = {};
Fn.Ajax = {
	/*
	Ajax 통신시 디폴트 설정값을 부여하는 처리를 한다.
	- $.ajax 와 옵션 동일 (하위 설명은 추가된 옵션)
	- pagination 옵션 : 페이징이 필요할 경우 사용한다. ex) var pagination = {pageRowCount : 10, pageIndex : 1}
	- optn.isLoading : 로딩 중 처리 여부
	*/
	send : function(optn){

		optn = optn || {};
		optn.type = optn.type || 'post';
		optn.async = optn.async == undefined ? true : optn.async;
		optn.isLoading = optn.isLoading == undefined ? true : optn.isLoading;
		optn.confirm = optn.confirm == undefined ? false : optn.confirm;

		if(optn.confirm){
			var cnfrmMsg = "";
			if(optn.confirm == "save"){
				cnfrmMsg = "저장 하시겠습니까?";
			}else if(optn.confirm == "delete"){
				cnfrmMsg = "삭제 하시겠습니까?";
			}else{
				cnfrmMsg = optn.confirm;
			}
			if(!confirm(cnfrmMsg)){
				return;
			}
		}

		optn.error = optn.error || function (xhr, status, error)
		{
			/* NOTE 응답이 JSON이 아닌경우가 있을 수 있나? */
			var response = null;
			try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };

			if(response.errorCode == '-9')
			{
				alert('개인정보 포함되어 있는 페이지 입니다. 추가인증을 진행해주세요.');
				if(optn.context)
				{
					optn.context.createPopup({
						id : "popup" + parseInt(Math.random()*100),
						url : "/sec/secondaryVerifyVC.do",
						width : 1200,
						modal : true,
						onClose: function(VC, data){
							//VC.fnSearchList();
						}
					}).open();
				}
				return;
			}

			switch(response.errorCode){
				case 'error.resultset.overflow':
					alert('최대 조회 건수 초과로 요청이 중단되었습니다.');
					break;
				case 'error.pwdByNotMatcher':
					alert("비밀번호는 영문(대소문자 구분), 숫자, 특수문자 조합 이여야 합니다.");
					break;
				case 'error.pwdBySame':
					alert("같은문자4개이상 사용이 불가합니다.");
					break;
				case 'error.pwdById':
					alert("비밀번호에 ID를 포함하실수없습니다.");
					break;
				case 'error.pwdByNull':
					alert("비밀번호에 공백문자가 포함되어있습니다.");
					break;
				case 'error.pwdByLength':
					alert("비밀번호는 9자~12자리만 입력됩니다.");
					break;
				default:
					if(response.errorStack){
						fnException(response);
					}else if(response.errorMessage){
						alert(response.errorMessage);
					}else{
						alert('요청 처리중 오류가 발생했습니다.');
					}
					if(optn.isLoading){
						Fn.Loading.end();
					}
			}

			//$("#loadResult").css("color", "red").text("Load failed: " + err).show();
		};

		optn.complete = optn.complete || function (data)
		{
			Fn.Loading.end();

			if(top.document.getElementById("spaTimeout") != undefined)
			{
				top.document.getElementById("spaTimeout").innerText = ssTimeout;
				top.Fn.Session.sessionTimeout = ssTimeout;

				top.headthcheck();
			}
		};

		optn.xhr = optn.xhr || function () {
			var xhr = new window.XMLHttpRequest();
			//Download progress
			xhr.addEventListener("progress", function (evt) {
				if (evt.lengthComputable) {
					//gridView.setProgress(0, evt.total, evt.loaded);
				}
			}, false);
			return xhr;
		};
		if(optn.pagination){
			optn.data.rows = optn.pagination.pageRowCount;
			optn.data.page = optn.pagination.pageIndex;
		}

		if(optn.isLoading){
			Fn.Loading.start();
		}

		return $.ajax({
	        url: optn.url,
	        type : optn.type,
	        async : optn.async,
	        data : optn.data,
	        dataType : optn.dataType,
	        success: optn.success,
	        error: optn.error,
	        complete: optn.complete,
	        xhr: optn.xhr
	    });
	},
	/*
	공통 콜백 함수
	- type : 처리할 callback 타입
	- gridView : 처리에 필요한 gridView Element
	- data : gridView 에 보여줄 데이터
	- pagination : 데이터 페이징시 pageBar 를 그려준다. ex) var pagination = {pageRowCount : 10, pageIndex : 1, pageFunction : arguments.callee, pageElement : $('#pager')[0]}
	*/
	callback : function(optn){
		Fn.Loading.end();

		optn = optn || {};
		optn.type = optn.type || "";

		if(optn.type == ""){

		}else if(optn.type == "search"){

			if(optn.data && optn.data.length > 0){
				optn.totalCount = optn.data[0].total || optn.data.length;
			}else{
				optn.totalCount = 0;
			}

			if(optn.pagination){
				optn.pagination.totalPage = Math.ceil(optn.totalCount / optn.pagination.pageRowCount);
			}

			//검색 후 그리드 처리..
			if(optn.gridView){
				var gridDiv = optn.gridView._gv._container._containerDiv;
				//grid info
				//if(gridDiv && gridDiv.previousElementSibling){
				if(gridDiv && gridDiv.nextElementSibling){
					if(gridDiv.nextElementSibling.className == 'paging'){
						if(optn.totalCount == 0){
							gridDiv.nextElementSibling.style.display = 'none';
						}else{
							gridDiv.nextElementSibling.style.display = "";
						}
					}
					//var divGridInfo = gridDiv.previousElementSibling.querySelector(".grid_info");
					var divGridInfo = gridDiv.nextElementSibling.querySelector(".grid_info");
					if(divGridInfo){
						//grid info data count
						optn.dataTotalCountElement = $(divGridInfo).find("span:eq(0) i")[0];
						//grid info page count
						if(optn.pagination){
							optn.pagination.pageCountElement = $(divGridInfo).find("span:eq(1) i:eq(0)")[0];
							optn.pagination.pageTotalCountElement = $(divGridInfo).find("span:eq(1) i:eq(1)")[0];
						}
					}
				}

				//grid paging
				if(gridDiv && gridDiv.nextElementSibling){
					if(optn.pagination){
						optn.pagination.pageElement = optn.pagination.pageElement || gridDiv.nextElementSibling;
					}
				}

				if(optn.pagination){
					var indicator = optn.gridView.getIndicator();
					if(indicator && indicator.displayValue == 'row'){
						optn.gridView.setIndicator({ rowOffset: optn.pagination.pageRowCount * (optn.pagination.pageIndex - 1) });
					}
				}

				Fn.Grid.setDatas(optn.gridView, optn.data);
				Fn.Grid.Focus.setRowIndex(optn.gridView, 0);
			}

			if(optn.dataTotalCountElement){
				optn.dataTotalCountElement.innerText = optn.totalCount;
			}
			if(optn.pagination){
				if(optn.pagination.pageCountElement){
					optn.pagination.pageCountElement.innerText = optn.pagination.pageIndex;
				}
				if(optn.pagination.pageTotalCountElement){
					optn.pagination.pageTotalCountElement.innerText = optn.pagination.totalPage;
				}
			}
			//
			if(optn.resize){ // resize를 할경우  Fn.Ajax.callback  resize: true 추가
				// 그리드안에 행의 갯수의 따라 reSize 한다..
				var rowCount = optn.gridView.getDataSource().orgDatas.length;  //조회된 행의 수
				var panelHeight = optn.gridView.getPanel().height;  //panel의 높이
				var headerHeight = optn.gridView.getHeader().height;  //header의 높이
				var rowHeight = optn.gridView.getDisplayOptions().rowHeight;  //행의 높이
				var footerHeight = optn.gridView.getFooter().height;  //footer의 높이
				var totalHeight = headerHeight + footerHeight + panelHeight + (rowHeight * rowCount) + (optn.gridView._gv._hscrollBar ? optn.gridView._gv._hscrollBar.height() + 2 : 2); //+2는 보정값입니다.
				//
				optn.context.$(gridDiv).height(totalHeight);
				//
				optn.gridView.resetSize();
			}
			/* paging 처리 */
			if(optn.pagination){

				$(optn.pagination.pageElement).find("p").empty();

				var pageCount = 10;
				var startPage = Math.floor((optn.pagination.pageIndex -1) / pageCount) * pageCount +1;
				var endPage = startPage + pageCount;
				if(endPage > optn.pagination.totalPage){
					endPage = optn.pagination.totalPage;
				}

				for(var i = startPage ; i <= endPage ; i++) {
					var link = document.createElement("a");
					link.href = "#";
					link.innerText = i;
					if(Number(optn.pagination.pageIndex) == Number(i)){
						link.className = "action";
					}else{
						link.onclick = function(e){
							if(optn.context){
								optn.pagination.pageFunction.call(optn.context, e.target.innerText);
							}else{
								optn.pagination.pageFunction(e.target.innerText);
							}
						}
					}
					$(optn.pagination.pageElement).find("p").append(link);
				}

				optn.pagination.pageElement.querySelector("a.p").onclick = function(){
					if(startPage == 1){
						if(optn.context){
							optn.pagination.pageFunction.call(optn.context, 1);
						}else{
							optn.pagination.pageFunction(1);
						}
					}else{
						if(optn.context){
							optn.pagination.pageFunction.call(optn.context, startPage-1);
						}else{
							optn.pagination.pageFunction(startPage-1);
						}
					}
				}

				optn.pagination.pageElement.querySelector("a.n").onclick = function(){
					if(optn.context){
						optn.pagination.pageFunction.call(optn.context, endPage);
					}else{
						optn.pagination.pageFunction(endPage);
					}
				}

				optn.pagination.pageElement.querySelector("a.pp").onclick = function(){
					if(optn.context){
						optn.pagination.pageFunction.call(optn.context, 1);
					}else{
						optn.pagination.pageFunction(1);
					}
				}

				optn.pagination.pageElement.querySelector("a.nn").onclick = function(){
					if(optn.context){
						optn.pagination.pageFunction.call(optn.context, optn.pagination.totalPage);
					}else{
						optn.pagination.pageFunction(optn.pagination.totalPage);
					}
				}
			}
		}else if(optn.type == "searchDetail"){
			var context = optn.context || window;
			if(optn.data && optn.data.length > 0){
				var rowData = optn.data[0];
				for(var key in rowData){
					if(context.$("#"+key).length || context.$("[id="+key+"]").length){
						var ele = context.$("#"+key)[0] || context.$("[id="+key+"]").eq(0)[0];
						if(ele.tagName.toLowerCase() == "input"){
							if(ele.type.toLowerCase() == "radio"){
								Fn.RadioBox.setValue({id : ele.id, value : rowData[key]})
							}else if(ele.type.toLowerCase() == "checkbox"){
								Fn.CheckBox.setValue({id : ele.id, value : rowData[key]})
							}else{
								$(ele).val(rowData[key]);
							}
						}else if("td,th,span".indexOf(ele.tagName.toLowerCase()) > -1){
							var tmp = rowData[key];
							if(rowData[key] != null && rowData[key] != 'null' ){
//								console.log("tmp : "+tmp);
								ele.innerHTML = tmp.toString().replace(/(?:\r\n|\r|\n)/g,'<br/>');
							}else{
								ele.innerHTML = '';
							}
						}else{
							$(ele).val(rowData[key]);
						}
					}
				}
			}
		}else if(optn.type == "save"){
			alert("저장하였습니다.");
		}
	}
}

Fn.Grid = {
	/* default option 설정 */
	/* 참조 : /ncp/WebContent/sample/sample.html */
	getDefaultOption : function(fields, optn){
		optn = optn || {};
		var option = {};
		option.fields = [];
		option.columns = [];

		var options = {
			panel	 :{ visible:false },
			stateBar: { visible: true },
			checkBar: { visible: false },
			indicator: { displayValue: "row" },
			footer: { visible: false },
			edit: { insertable: true, appendable: true, editable: true, updatable: true, deletable: true },
			display: { showEmptyMessage: true, emptyMessage: '조회된 데이터가 없습니다.' }
		};
		$.extend(true, options, optn.options);
		$.extend(option, optn);
		option.options = options;

		var column;
		for(var i = 0 ; i < fields.length ; i++){

			//fields dataType : text, bool, number, datetime
			fields[i].dataType = fields[i].dataType || "text";

			option.fields.push({ fieldName : fields[i].name, dataType : fields[i].dataType, length : fields[i].length });

			if(fields[i].column){
				column = fields[i].column;
				column.fieldName = fields[i].name;

				column.header = column.header || {};
				column.editor = column.editor || {};
				column.styles = column.styles || {};

				//editor type : line, multiLine, search, dropDown, number, date
				column.editor.type = column.editor.type || "line";

				if(column.editor.type == "dropDown"){
					column.editor.domainOnly = column.editor.domainOnly == undefined ? true : column.editor.domainOnly;
					column.lookupDisplay = column.lookupDisplay == undefined ? true : column.lookupDisplay;
				}else if(column.editor.type == "date"){
					column.editor.editFormat = column.editor.editFormat || "yyyy-MM-dd";
				}else if(column.editor.type == "number"){
					column.styles.numberFormat = column.styles.numberFormat || "#,##0";
				}

				if(column.renderer && column.renderer.type == "check"){
					column.editable = column.editable == undefined ? false : column.editable;
					column.renderer.editable = column.renderer.editable == undefined ? true : column.renderer.editable;
					column.renderer.startEditOnClick = column.renderer.startEditOnClick == undefined ? true : column.renderer.startEditOnClick;
					column.renderer.trueValues = column.renderer.trueValues == undefined ? "true" : column.renderer.trueValues;
					column.renderer.falseValues = column.renderer.falseValues == undefined ? "false" : column.renderer.falseValues;
				}

				if(column.button){
					column.alwaysShowButton = column.alwaysShowButton == undefined ? true : column.alwaysShowButton;
					column.isReadOnly = true;
				}
				option.columns.push(column);
			}
		}
		return option;
	},
	/*
	그리드 생성
	- 그리드 생성 옵션은 RealGrid 와 동일하다. (하위 설명은 추가된 옵션)
	- optn.divId : 그리드의 div id
	- optn.gridViewId : 자바스크립트에 호출할 그리드 상수명
	- optn.dataProviderId : 자바스크립트에 호출할 dataProviderId 상수명
	- optn.columns[i].editor.codes : editor 정보에 code 값들을 세팅해준다
	- optn.columns[i].isRequired : 필수여부을 체크해준다
	- optn.columns[i].isReadOnly : 수정할 수 없도록 처리한다
	- optn.editType : 그리드 수정시 기본적으로 list 단위로 처리함, editType 을 row 로 할 경우, 그리드 수정을 row 단위로 처리하도록 설정
	*/
	create : function(optn){
		optn = optn || {};
		optn.divId = optn.prefix ? optn.prefix + 'GridContainer' : (optn.divId || "container");
		optn.fields = optn.fields || [];
		optn.columns = optn.columns || [];

		optn.options = optn.options || {};

		optn.trace = optn.trace || false;
		optn.rootContext = optn.rootContext || "/sample/lib";
		optn.gridViewId = optn.prefix ? optn.prefix + 'GridView' : (optn.gridViewId || "gridView");
		optn.dataProviderId = optn.prefix ? optn.prefix + 'DataProvider' : (optn.dataProviderId || "dataProvider");
		optn.editType = optn.editType || "list";
		optn.validations = optn.validations || [];
		optn.options = $.extend(true, {
			display: {
				  showEmptyMessage: true
				, emptyMessage: '조회된 데이터가 없습니다.'
			}
		}, optn.options);

		if(optn.options && (!optn.options.select && !optn.options.selecting)){
			optn.options.selecting = {style : 'rows' };
		}

		//2018.10.26 추가
		for(var i = 0 ; i < optn.columns.length ; i++){
			var column = optn.columns[i];
			if(optn.textAlignment){
				if(!column.styles.textAlignment){
					column.styles.textAlignment = optn.textAlignment;
				}
			}

			if(!column.name && column.fieldName){
				column.name = column.fieldName;
			}else if(column.name && !column.fieldName){
				column.fieldName = column.name;
			}

			if(optn.cursor){
				column.cursor = optn.cursor;
			}
		}

		var dataProvider;
		var gridView;
		/*---------------------------------------------------------------------------------------
		화면초기화
		---------------------------------------------------------------------------------------*/
		RealGridJS.setTrace(optn.trace);
		RealGridJS.setRootContext(optn.rootContext);
		dataProvider = new RealGridJS.LocalDataProvider();
		gridView = new RealGridJS.GridView(optn.context ? optn.context.real(optn.divId) : optn.divId);
		/* HTML요소에 컴포넌트 주입. HTML요소에서 컴포넌트를 꺼내기 위함. */
		$('#' + (optn.context ? optn.context.real(optn.divId) : optn.divId)).data('grid', gridView).find('input').attr('title', '맞춤법검사용숨겨진입력란');
		gridView.setDataSource(dataProvider);

		/*---------------------------------------------------------------------------------------
		set fields
		---------------------------------------------------------------------------------------*/
		// fields dataType : text, bool, number, datetime
		/* ex)
		optn.fields = [
			{ fieldName : "number", dataType : "number" },
			{ fieldName : "text", dataType : "text" },
			{ fieldName : "datetime", dataType : "datetime" },
			{ fieldName : "boolean", dataType : "boolean" }
		];
		*/
		// DataProvider의 setFields함수로 필드를 입력합니다.
		dataProvider.setFields(optn.fields);

		/*---------------------------------------------------------------------------------------
		set columns
		---------------------------------------------------------------------------------------*/
		//editor type : line, multiLine, search, dropDown, number, date
		/*
		optn.columns = [
			{ name : "number", fieldName : "number", header : { text : "number" }, width : 100, isRequired : true, editor :{type:"number"} },
			{ name : "text", fieldName : "text", header : { text : "text" }, width : 150, editor :{type:"dropDown", codes : codeDatas} },
			{ name : "date", fieldName : "date", header : { text: "date" }, width : 150, editor :{type:"date"}},
		];
		*/
		// codes 처리
		for(var i = 0 ; i < optn.columns.length ; i++){
			if(optn.columns[i].editor && optn.columns[i].editor.codes){
				optn.columns[i] = setCodes(optn.columns[i]);
			}
		}

		// codes setting
		function setCodes(column){
			column.editor = column.editor || {};
			column.editor.codes = column.editor.codes || [];
			column.labels = column.labels || [];
			column.values = column.values || [];
			for(var i = 0 ; i < column.editor.codes.length ; i++){
				column.labels.push(column.editor.codes[i].label);
				column.values.push(column.editor.codes[i].value);
			}
			return column;
		}

		// validation 초기화
		for(var i = 0 ; i < optn.columns.length ; i++){
			if(!Array.isArray(optn.columns[i].validations)){
				optn.columns[i].validations = [];
			}
		}


		/* ex)
		optn.columns = [
			{ name : "number", fieldName : "number", header : { text : "number" }, width : 100, isRequired : true, isReadOnly : true },
		];
		*/
		for(var i = 0 ; i < optn.columns.length ; i++){
			// validation 필수 체크..
			// isRequired : true
			if(optn.columns[i].isRequired){
				optn.columns[i].validations.push({ criteria: "value is not empty", message: optn.columns[i].header.text+" 값은 반드시 필요합니다." });
			}
			// 읽기전용 체크
			// isReadOnly : true
			if(optn.columns[i].isReadOnly){
				optn.columns[i].editable = false;
			}
		}

		// validation 체크
		gridView.onValidateRow = optn.onValidateRow;
		gridView.setValidations(optn.validations);

		// event handling
		gridView.onCellButtonClicked = optn.onCellButtonClicked;
		gridView.onImageButtonClicked = optn.onImageButtonClicked;

		// 컬럼을 GridView에 입력 합니다.
		gridView.setColumns(optn.columns);

		/*---------------------------------------------------------------------------------------
		set options
		---------------------------------------------------------------------------------------*/
		// 그리드 옵션을 설정합니다.
		gridView.setOptions(optn.options);

		/* Row 단위로 처리가 필요 할 경우  */
		gridView.editType = optn.editType;
		if(optn.editType == "row"){
			gridView.onCurrentChanging = function(grid, oldIndex, newIndex){
				if(grid.isItemEditing()){
					if(oldIndex.itemIndex != newIndex.itemIndex){
						alert("변경된 데이터 저장해주세요.");
						return false;
					}
				}
			}
		}

		/*---------------------------------------------------------------------------------------
		그리드 스킨 (realgridjs-api.1.1.28.js 로 옮김)
		---------------------------------------------------------------------------------------*/



		if(optn.context){
			// ViewController에 등록한다.
			optn.context.registerObject(optn.gridViewId, gridView, optn.dataProviderId, dataProvider);
		}else{
			// 변수 선언 없이 바로 생성 된다.
			window[optn.gridViewId] = gridView;
			window[optn.dataProviderId] = dataProvider;
		}

	},
	/* 그리드 값을 dataProvider 에 커밋 */
	commit : function(gv){
		try{
			gv.commit();
		}catch(exception){
			alert(exception.message);
			throw exception;
		}
	},
	/* 그리드에서 상태값을 포함한 데이터 값 반환 */
	getDatas : function(gv){
		Fn.Grid.commit(gv);
		var provider = gv.getDataProvider();
		var datas = provider.getJsonRows();
		for(var i = 0 ; i < datas.length ; i++){
			datas[i].rowStatus  = provider.getRowState(i);
			format(gv, datas[i]);
		}
		return datas;

		function format(gv, data){
			var names = gv.getDataProvider().getOrgFieldNames();
			var field;
			for(var i = 0 ; i < names.length ; i++){
				field = gv.getDataProvider().fieldByName(names[i]);
				console.log("field  > "+field.dataType);
				if(field.dataType == "textDate" && data[names[i]] != null){
					data[names[i]] = data[names[i]].replace(/-/gi, "");
				}
				if(field.dataType == "textDatetime" && data[names[i]] != null){
					data[names[i]] = data[names[i]].replace(/-/gi, "").replace(/:/gi, "");
				}
				if(field.dataType == "textTime" && data[names[i]] != null){
					data[names[i]] = data[names[i]].replace(/:/gi, "");
				}
				if(field.dataType == "datetime" && data[names[i]] != null){
					var hanCheck = /[가-힝]/;
					if(hanCheck.test(data[names[i]])){
						data[names[i]] = Fn.String.formatDateByNewDate(data[names[i]]);
					}else{
						data[names[i]] = data[names[i]].replace(/-/gi, "");
					}
				}
			}
		}
	},
	/* 그리드 데이터 설정 */
	setDatas : function(gv, datas){
		optn = {};
		optn.count = optn.count || 100;

		for(var i = 0 ; i < datas.length ; i++){
			format(gv, datas[i]);
		}

		//rollback backup
		gv.getDataProvider().orgDatas = datas;
		//gv.getDataProvider().fillJsonData(datas, { count : optn.count });
		gv.getDataProvider().fillJsonData(datas, { fillMode: "Insert" });

		function format(gv, data){
			var names = gv.getDataProvider().getOrgFieldNames();
			var field;
			for(var i = 0 ; i < names.length ; i++){
				field = gv.getDataProvider().fieldByName(names[i]);
				if(field.dataType == "textDate" && data[names[i]] != null){
					data[names[i]] = Fn.String.formatDate(data[names[i]]);
				}
				if(field.dataType == "textDatetime" && data[names[i]] != null){
					data[names[i]] = Fn.String.formatDatetime(data[names[i]]);
				}
				if(field.dataType == "textTime" && data[names[i]] != null){
					data[names[i]] = Fn.String.formatTime(data[names[i]]);
				}
			}
		}
	},
	rollback : function(gv){
		gv.cancel();
		Fn.Grid.setDatas(gv, gv.getDataProvider().orgDatas);
	},
	/* 그리드 행 추가 */
	addRow : function(gv){
		//Row 단위 처리시
		if(gv.editType == "row"){
			if(gv.isItemEditing()){
				alert("변경된 데이터 저장해주세요.");
				return false;
			}
		}
		Fn.Grid.commit(gv);
		//gv.beginAppendRow();
		gv.setCurrent({itemIndex:gv.getDataProvider().addRow({})});
		gv.showEditor();
		gv.setFocus();
	},
	/* 그리드 행 삭제 */
	removeRow : function(gv){
		//Fn.Grid.commit(gv);
		//console.log(gv.getCurrent());
		var dataRow = gv.getCurrent().dataRow;
		//행 추가 후 데이터가 없는 빈 열일때 - 추가 된 행이며 dataProvider 에도 데이터가 없기 때문에 gridView 에서만 지워준다.
		if(dataRow == -1){
			gv.cancel();
		}else{
			var prov = gv.getDataProvider();
			//console.log(prov.getRowState(dataRow));
			//행 추가 후 데이터가 있는 열 삭제 - 추가 된 행이며 dataProvider 에 데이터가 있기 때문에 dataProvider 에서 지워준다.
			if(prov.getRowState(dataRow) == "created"){
				prov.removeRow(dataRow);
			}else{
				//실제 DB에서 삭제가 필요함
				prov.setRowState(dataRow, "deleted", true);
			}
		}
	},
	/* 행 데이터 반환 */
	getRowData : function(gv, rowIndex){
		var prov = gv.getDataProvider();
		return prov.getJsonRow(rowIndex);
	},
	/* 행 데이터 설정 */
	setRowData : function(gv, rowIndex, data){
		for(var key in data){
			if(Fn.Grid.isField(gv, key)){
				Fn.Grid.setCellData(gv, rowIndex, key, data[key]);
			}
		}
	},
	rollbackRow : function(gv, rowIndex){
		var prov = gv.getDataProvider();
		if(prov.orgDatas[rowIndex] == undefined){
			//행추가 그리드 커밋 후
			prov.removeRow(rowIndex);
		}else{
			//그리드 커밋 후
			Fn.Grid.setRowData(gv, rowIndex, prov.orgDatas[rowIndex]);
			Fn.Grid.setRowState(gv, rowIndex, "none");
		}
	},
	/* 셀 데이터 반환 */
	getCellData : function(gv, rowIndex, cellIndex){
		var prov = gv.getDataProvider();
		return prov.getValue(rowIndex, cellIndex);
	},
	/* 셀 데이터 설정 */
	setCellData : function(gv, rowIndex, cellIndex, value){
		var prov = gv.getDataProvider();
		prov.setValue(rowIndex, cellIndex, value);
	},
	setRowDataAndBind : function(gv, rowIndex, data){
		Fn.Grid.setRowData(gv, rowIndex, data);
		for(var key in data){
			$(gv.bindForm).find("[data-column="+key+"]").val(data[key]);
		}
	},
	/* 셀 데이터 설정 */
	setCellDataAndBind : function(gv, rowIndex, cellName, value){
		Fn.Grid.setCellData(gv, rowIndex, cellName, value);
		$(gv.bindForm).find("[data-column="+cellName+"]").val(value);
	},
	/* 상태값변환 */
	getRowState : function(gv, rowIndex){
		var prov = gv.getDataProvider();
		return prov.getRowState(rowIndex);
	},
	/* 상태값변환 */
	setRowState : function(gv, rowIndex, rowState){
		var prov = gv.getDataProvider();
		prov.setRowState(rowIndex, rowState, true);
	},
	setEditOptions : function(gv, optn){
		gv.setEditOptions(optn);
	},
	/* 그리드 수정된 Row 수 */
	getEditRowCount : function(gv){
		var count = 0;
		count += gv.getDataProvider().getRowStateCount("created");
		count += gv.getDataProvider().getRowStateCount("updated");
		count += gv.getDataProvider().getRowStateCount("deleted");
		return count;
	},
	/* 체크박스체크 */
	checkRow : function(gv, rowIndex,stats){
		return gv.checkItem(rowIndex, stats);
	},
	/* 선택범위 데이터 복사 */
	copyDatas : function(gv){
        var selData = gv.getSelectionData();
        gv.getDataProvider().fillJsonData(JSON.stringify(selData), { fillMode: "append" });
	},
	isField : function(gv, fieldName){
		var prov = gv.getDataProvider();
		var names = prov.getOrgFieldNames();
		for(var i = 0 ; i < names.length ; i++){
			if(fieldName == names[i]){
				return true;
			}
		}
		return false;
	},
	clear : function(gv){
		gv.getDataProvider().clearRows();
	},
	getCheckedDatas : function(gv){
		var checkedDatas = [];
		var datas = Fn.Grid.getDatas(gv);
		var array = gv.getCheckedRows(false);
		for(var i = 0 ; i < array.length ; i++){
			checkedDatas.push(datas[array[i]]);
		}
		return checkedDatas;
	},
	getUncheckedDatas : function(gv){
		var uncheckedDatas = [];
		var datas = Fn.Grid.getDatas(gv);
		var array = gv.getCheckedRows(false);

		for(var i = 0 ; i < datas.length ; i++){
			var isUnchecked = true;
			for(var j = 0 ; j < array.length ; j++){
				if(i == array[j]){
					isUnchecked = false;
					break;
				}
			}
			if(isUnchecked){
				uncheckedDatas.push(datas[i]);
			}
		}
		return uncheckedDatas;
	},
	/*
	그리드의 정보 상세 보기 생성
	- thegrid : 그리드 object
	- theform : 상세보기 form object
	- callbacks : 그리드의 onCurrentRowChanged 이벤트를 상세보기에서 사용하면 다른 이벤트를 추가 할 수 없는 경우가 발생하여 기타 이벤트가 필요할 경우 추가한다.
	- onEdit
	- context : ViewController에서 사용시 VC를 넣어준다.
	*/
	bind : function(thegrid, theform, callbacks, onEdit, context) {
		var thegrid1 = thegrid;
		var theform1 = theform;
		thegrid1.bindForm = theform;
		var context = context || window;

		//thegrid.onCurrentChanged = function (grid, newIndex)
		thegrid.onCurrentRowChanged = function (grid, oldIndex, newIndex)
   		{
			theform.reset();

			var curRow = null;

			if(newIndex > -1){
				//curRow = grid.getValues(newIndex);
				curRow = grid.getDataProvider().getJsonRow(newIndex);
			}

			if(curRow != null){
				context.$('#' + theform1.name + ' [data-column]').each(
					function(index)
					{
						var theinput = $(this);
						var theid = theinput.attr('data-column');

						try {

							if(this.tagName.toLowerCase() == "input"){
								if(this.type.toLowerCase() == "text" || this.type.toLowerCase() == "password" || this.type.toLowerCase() == "hidden"){
									theinput.val(Format.setForm(theid, curRow[theid]));
								}else if(this.type.toLowerCase() == "radio"){
									if(this.value == curRow[theid]){
										this.checked = true;
									}
								}else if(this.type.toLowerCase() == "checkbox"){
									var values = curRow[theid].split(",");
									for(var i = 0 ; i < values.length ; i++){
										if(this.name == values[i]){
											this.checked = true;
										}
									}
								}
							}else if(this.tagName.toLowerCase() == "select"){
								theinput.val(curRow[theid]);
							}else if(this.tagName.toLowerCase() == "textarea"){
								theinput.val(curRow[theid]);
							}else if(this.tagName.toLowerCase() == "span"){
								theinput.text(curRow[theid] || '');
							}


						} catch(e) { console.error(e); theform.reset(); }
						//console.log($('#' + theform1.name + ' ' + input.attr('id')));
						/*
						//console.log('type : ' +  + ', id : ' + input.attr('id') + ', name : ' + input.attr('name') + ', value : ' + input.val());
						$('#' + input.attr('id')).bind('focusout', function() {
							//alert($(this).text());
							console.log(input.val());
						});*/
					}
				);
			}

			//var value = grid.getValue(newIndex.itemIndex, newIndex.fieldName);
			//$('#' + newIndex.fieldName).val(value);
			//$("#mainform [data-column='" + newIndex.fieldName + "']").val(value);
			//console.log(newIndex);
			// {itemIndex: 0, column: "col1", dataRow: 0, fieldIndex: 0, fieldName: "emplyrId"}
			//console.log("thegrid.onCurrentChanged: " + "(" + newIndex.itemIndex + ", " + newIndex.column + ")");


			//console.log(grid.getValue(newIndex.itemIndex, newIndex.fieldName));
			//console.log(Fn.Grid.getCellData(gridView, newIndex.itemIndex, newIndex.dataRow));

	   		if(callbacks && callbacks.onCurrentRowChanged){
	   			callbacks.onCurrentRowChanged = Array.isArray(callbacks.onCurrentRowChanged) ? callbacks.onCurrentRowChanged : [callbacks.onCurrentRowChanged];
	   			for(var i = 0 ; i < callbacks.onCurrentRowChanged.length ; i++){
	   				callbacks.onCurrentRowChanged[i](grid, oldIndex, newIndex);
	   			}
	   		}
   		};

   		if (!onEdit) {
	   		thegrid.onEditChange = function (grid, index, value)
	   		{
	   			context.$("#" + theform1.name + " [data-column='" + index.fieldName + "']").val(Format.setForm(index.fieldName, value));

		   		if(callbacks && callbacks.onEditChange){
		   			callbacks.onEditChange = Array.isArray(callbacks.onEditChange) ? callbacks.onEditChange : [callbacks.onEditChange];
		   			for(var i = 0 ; i < callbacks.onEditChange.length ; i++){
		   				callbacks.onEditChange[i](grid, index, value);
		   			}
		   		}
	   		};

	   		context.$('#' + theform.name + ' [data-column]').each(
				function(index)
				{
					var input = $(this);
					//console.log('type : ' + input.attr('type') + ', id : ' + input.attr('id') + ', name : ' + input.attr('name') + ', value : ' + input.val());
					input.bind('focusout', setValue);
					input.bind('keyup', setValue);
					input.bind('change', setValue);
				}
			);

	   		function setValue(){
	   			if(this.tagName.toLowerCase() == "input"){
					if(this.type.toLowerCase() == "text"){
						thegrid1.setValue(thegrid1.getCurrent().itemIndex, $(this).attr('data-column'), Format.setGrid($(this).attr('data-column'), this.value));
					}else if(this.type.toLowerCase() == "radio"){
						thegrid1.setValue(thegrid1.getCurrent().itemIndex, $(this).attr('data-column'), this.value);
					}else if(this.type.toLowerCase() == "checkbox"){
						var values = [];
						context.$('#' + theform.name + ' [data-column=' + $(this).attr('data-column')+']').each(function(){
							if(this.checked){
								values.push(this.name);
							}
						});
						thegrid1.setValue(thegrid1.getCurrent().itemIndex, $(this).attr('data-column'), values.toString());
					}
				}else if(this.tagName.toLowerCase() == "select"){
					thegrid1.setValue(thegrid1.getCurrent().itemIndex, $(this).attr('data-column'), this.value);
				}else if(this.tagName.toLowerCase() == "textarea"){
					thegrid1.setValue(thegrid1.getCurrent().itemIndex, $(this).attr('data-column'), this.value);
				}
	   		}
		}

   		var Format = {
   			setForm : function(fieldName, value){
   	   			var columnInfo = thegrid1.columnByField(fieldName);
   	   			if(columnInfo && columnInfo.editorOptions && columnInfo.editorOptions.type == "number" && value){
   					value = Fn.Number.setComma(value);
   				}
   	   			return value;
   	   		},
   			setGrid : function(fieldName, value){
   	   			var columnInfo = thegrid1.columnByField(fieldName);
   	   			if(columnInfo && columnInfo.editorOptions && columnInfo.editorOptions.type == "number" && value){
   					value = value.replace(/,/gi, "");
   				}
   	   			return value;
   	   		}
   		}
	}
}

Fn.TreeGrid = {
	/* Tree그리드 생성 */
	create : function(optn){
		optn = optn || {};
		optn.divId = optn.prefix ? optn.prefix + 'TreeContainer' : (optn.divId || "treeContainer");
		optn.fields = optn.fields || [];
		optn.columns = optn.columns || [];
		optn.options = optn.options || {};
		optn.fixedOptions = optn.fixedOptions || {};
		optn.trace = optn.trace || false;
		optn.rootContext = optn.rootContext || "/sample/lib";
		optn.gridViewId = optn.prefix ? optn.prefix + 'TreeView' : (optn.gridViewId || "treeView");
		optn.dataProviderId = optn.prefix ? optn.prefix + 'TreeProvider' : (optn.dataProviderId || "treeProvider");

		var treeProvider;
		var treeView;
		/*---------------------------------------------------------------------------------------
		화면초기화
		---------------------------------------------------------------------------------------*/
		RealGridJS.setTrace(optn.trace);
		RealGridJS.setRootContext(optn.rootContext);
		treeProvider = new RealGridJS.LocalTreeDataProvider();
		treeView = new RealGridJS.TreeView(optn.context ? optn.context.real(optn.divId) : optn.divId);
		/* HTML요소에 컴포넌트 주입. HTML요소에서 컴포넌트를 꺼내기 위함. */
		$('#' + (optn.context ? optn.context.real(optn.divId) : optn.divId)).data('grid', treeView).find('input').attr('title', '맞춤법검사용숨겨진입력란');
		treeView.setDataSource(treeProvider);

		// DataProvider의 setFields함수로 필드를 입력합니다.
		treeProvider.setFields(optn.fields);

		// 컬럼을 GridView에 입력 합니다.
		treeView.setColumns(optn.columns);

		// 트리 그리드 행 선택 설정  // 스타일 미적용시 options 에 select   : true, 추가
		if(!optn.options.select){
			optn.options.select = {style : RealGridJS.SelectionStyle.SINGLE_ROW};
		}
		// 그리드 옵션을 설정합니다.
		treeView.setOptions(optn.options);

		if(optn.context){
			// ViewController에 등록한다.
			optn.context.registerObject(optn.gridViewId, treeView, optn.dataProviderId, treeProvider);
		}else{
			// 변수 선언 없이 바로 생성 된다.
			window[optn.gridViewId] = treeView;
			window[optn.dataProviderId] = treeProvider;
		}

	 	treeView.setDisplayOptions({focusColor:true, rowHeight:30, fitStyle: "even"});
	 	treeView.setHeader({height: 40});

		/*treeView.setStyles({
			grid:{
				line:"#00dddddd",
				borderRight:"#00dddddd",
				border:"#00dddddd,0px"
			},
			body:{
				borderRight:"#00ffffff",
				borderBottom:"#00ffffff",
				foreground:"#ff676767",
				dynamicStyles:[{
					criteria:"(row mod 2) = 0",
					styles:{
						 background:"#fff5f5f5"
					}
				}]
			},
			header:{
				background:"#ffffffff",
				selectedBackground:"#ffffffff",
				selectedForeground:"#ff333333",
				borderBottom:"#ffe6e6e6",
				borderTop:"#ff454545",
				fontBold: true
			},
			selection:{
				background:"#456c6c6c",
				border:"#00000000,1px"
			},
			indicator:{
				selectedBackground:"#ffffffff",
				selectedForeground:"#ff333333",
				background: "#ffffffff",
				borderRight:"#00ffffff",
				borderBottom:"#00ffffff",
				foreground:"#ff676767",
				dynamicStyles:[{
					criteria:"(row mod 2) = 0",
					styles:{
						 background:"#fff5f5f5"
					}
				}]
			},
			stateBar:{
				background: "#ffffffff",
				borderRight:"#00ffffff",
				borderBottom:"#00ffffff",
				foreground:"#ff676767",
				dynamicStyles:[{
					criteria:"(row mod 2) = 0",
					styles:{
						 background:"#fff5f5f5"
					}
				}]
			},

			checkBar:{
				background: "#ffffffff",
				borderRight:"#00ffffff",
				borderBottom:"#00ffffff",
				foreground:"#ff676767",
				dynamicStyles:[{
					criteria:"(row mod 2) = 0",
					styles:{
						 background:"#fff5f5f5"
					}
				}]
			}
		});*/







	},
	commit : function(gv){
		try{
			gv.commit();
		}catch(exception){
			alert(exception.message);
			throw exception;
		}
	},
	/* 상태값을 포함한 데이터 값 반환 */
	getDatas : function(gv){
		Fn.TreeGrid.commit(gv);
		var temp = [];
		var provider = gv.getDataProvider();
		var state = provider.getAllStateRows();
		if(state.created.length > 0){
			for(var i = 0 ; i < state.created.length ; i++){
				var tempObj = {};
				tempObj.rowStatus = "created";
        		data = provider.getJsonRow(state.created[i]);
        		$.each(data, function(key,value){
        			tempObj[key] = value;
        		});
				//
				temp.push(tempObj);
			}
		}
		if(state.updated.length > 0){
			for(var i = 0 ; i < state.updated.length ; i++){
				var tempObj = {};
				tempObj.rowStatus = "updated";
        		data = provider.getJsonRow(state.updated[i]);
        		$.each(data, function(key,value){
        			tempObj[key] = value;
        		});
				//
				temp.push(tempObj);
			}
		}
		if(state.deleted.length > 0){
			for(var i = 0 ; i < state.deleted.length ; i++){
				var tempObj = {};
				tempObj.rowStatus = "deleted";
        		data = provider.getJsonRow(state.deleted[i]);
        		$.each(data, function(key,value){
        			tempObj[key] = value;
        		});
				//
				temp.push(tempObj);
			}
		}
		return temp;
	},
	setDatas : function(gv,datas,optn){
		optn = {};
		optn.count = optn.count || 100;
		var provider = gv.getDataProvider();
		provider.setRows(datas,"tree");
	},
	/* 그리드 행 추가 */
	addRow : function(gv){
		Fn.TreeGrid.commit(gv);
		var dataRow = gv.getCurrent().dataRow;
		var level  = gv.getDataProvider().getLevel(dataRow);
		var count = gv.getDataProvider().getChildCount(dataRow);
		/*if(level == "4"){
			alert("상위레벨을 선택하여주십시오.");
			return false;
		}*/
		gv.getDataProvider().insertChildRow(dataRow, count, [], 0);
	},
	/* 그리드 삭제 */
	removeRow : function(gv){
		var dataRow = gv.getCurrent().dataRow;
		if(dataRow == -1){
			gv.cancel();
		}else{
			//gv.getDataProvider().setRowStates(dataRow, "deleted", true);
			gv.getDataProvider().removeRow(dataRow);
		}
	},
	/* 행 데이터 반환 */
	getRowData : function(gv, rowIndex){
		var prov = gv.getDataProvider();
		return prov.getJsonRow(rowIndex);
	},
	/* 셀 데이터 반환 */
	getCellData : function(gv, rowIndex, cellIndex){
		var prov = gv.getDataProvider();
		return prov.getValue(rowIndex, cellIndex);
	},
	/* 셀 데이터 설정 */
	setCellData : function(gv, rowIndex, cellIndex, value){
		var prov = gv.getDataProvider();
		prov.setValue(rowIndex, cellIndex, value);
	},
	/* 상태값변환 */
	getRowState : function(gv, rowIndex){
		var prov = gv.getDataProvider();
		return prov.getRowState(rowIndex);
	},
	/* 상태값변환 */
	setRowState : function(gv, rowIndex, rowState){
		var prov = gv.getDataProvider();
		prov.setRowState(rowIndex, rowState, true);
	},
	/* 체크박스체크 */
	checkRow : function(gv, rowIndex,stats){
		return gv.checkItem(rowIndex, stats);
	},
	/* 체크박스 체크 해제*/
	checkTree : function (gv,prov,itemIndex,checked){
		if(gv.isCheckedRow(itemIndex + 1)){
			var data = gv.getDataProvider().getJsonRow(itemIndex+1);
			//
			if(data.lvl == "1"){
				//
				rows = prov.getDescendants(itemIndex + 1);
				gv.checkRows(rows, checked);
				//
			}else{
				//
				Fn.TreeGrid.checkParent(gv,prov,itemIndex,checked);
				//
			}
		}else{
			var rows = prov.getDescendants(itemIndex + 1);
			gv.checkRows(rows, checked);
		}
	},
	checkParent : function(gv,prov,pIdx,checked){
		var rows;
		var descCnt = prov.getDescendantCount(pIdx + 1);
		if(descCnt > 0){
			//
			rows = prov.getDescendants(pIdx + 1);
			gv.checkRows(rows, checked);
			//
			rows = prov.getAncestors(pIdx + 1);
			gv.checkRows(rows, checked);
			//
		}else{
			//
			rows = prov.getAncestors(pIdx + 1);
			gv.checkRows(rows, true);
			//
		}
	},
	bind : function(thegrid, theform, callback, onEdit) {
		var thegrid1 = thegrid;
		var theform1 = theform;
		thegrid.onCurrentChanged = function (grid, newIndex)
   		{
			var curRow = grid.getDataProvider().getJsonRow(newIndex.dataRow);
			$('#' + theform1.name + ' [data-column]').each(
				function(index)
				{
					var theinput = $(this);
					var theid = theinput.attr('data-column');
					theinput.val(curRow[theid]);
				}
			);
   		};

   		if(!onEdit) {
	   		thegrid.onEditChange = function (grid, index, value)
	   		{
	   			$("#" + theform1.name + " [data-column='" + index.fieldName + "']").val(value);
	   		};

	   		$('#' + theform.name + ' [data-column]').each(
				function(index)
				{
					var input = $(this);
					$('#' + input.attr('id')).bind('focusout', function() {
						thegrid1.setValue(thegrid1.getCurrent().dataRow-1, input.attr('data-column'), input.val());
					});
					$('#' + input.attr('id')).bind('keyup', function() {
						thegrid1.setValue(thegrid1.getCurrent().dataRow-1, input.attr('data-column'), input.val());
					});
				}
			);
   		}
	}
}

/* 그리드에서 선택된 셀 관련 함수 */
Fn.Grid.Focus = {
	/* 선택된 셀의 row, cell 순번 가져오기 */
	getIndex : function(gv){
		return {
			rowIndex : gv.getCurrent().dataRow,
			cellIndex : gv.getCurrent().fieldIndex
		}
	},
	/* 선택된 셀의 row 순번 가져오기 */
	getRowIndex : function(gv){
		return Fn.Grid.Focus.getIndex(gv).rowIndex;
	},
	setRowIndex : function(gv, rowIndex){
		Fn.Grid.Focus.setCellIndex(gv, rowIndex, 1);
	},
	/* 선택된 셀의 cell 순번 가져오기 */
	getCellIndex : function(gv){
		return Fn.Grid.Focus.getIndex(gv).cellIndex;
	},
	setCellIndex : function(gv, rowIndex, cellIndex){
		gv.setCurrent({dataRow : rowIndex, column : cellIndex});
	},
	/* 선택된 셀의 row 데이터 가져오기 */
	getRowData : function(gv){
		return Fn.Grid.getRowData(gv, Fn.Grid.Focus.getRowIndex(gv));
	},
	/* 선택된 셀의 row 데이터 넣기 */
	setRowData : function(gv, data){
		Fn.Grid.setRowData(gv, Fn.Grid.Focus.getRowIndex(gv), data);
	},
	/* 선택된 셀의 row 데이터 넣기 */
	setRowDataAndBind : function(gv, data){
		Fn.Grid.setRowDataAndBind(gv, Fn.Grid.Focus.getRowIndex(gv), data);
	},
	/* 선택된 셀의 cell 데이터 가져오기 */
	getCellData : function(gv){
		return Fn.Grid.getCellData(gv, Fn.Grid.Focus.getRowIndex(gv), Fn.Grid.Focus.getCellIndex(gv));
	},
	/* 선택된 셀의 cell 데이터 넣기 */
	setCellData : function(gv, data){
		Fn.Grid.setCellData(gv, Fn.Grid.Focus.getRowIndex(gv), Fn.Grid.Focus.getCellIndex(gv), data);
	},
	setCellDataAndBind : function(gv, data){
		Fn.Grid.setCellDataAndBind(gv, Fn.Grid.Focus.getRowIndex(gv), Fn.Grid.Focus.getCellIndex(gv), data);
	},
	cancel : function(gv){
		var rowIndex = Fn.Grid.Focus.getRowIndex(gv);
		var rowCount = gv.getDataProvider().getRowCount();
		if(rowIndex < rowCount){
			if(Fn.Grid.getRowState(gv, rowIndex) == "none"){
				//commit 전
				gv.cancel();
			}else{
				//commit 후
				Fn.Grid.rollbackRow(gv, rowIndex);
			}
		}else{
			//행추가 commit 전
			gv.cancel();
		}

	}
}

function setOptions(grid) {
	var options =  {
		panel: {
			visible: false
		},
		footer: {
			visible: false
		},
		checkBar: {
			visible: false
		},
		stateBar: {
			visible: false
		},
		indicator: {
			visible: false
		}
	};

	grid.setOptions(options);

	grid.setHeader({height: 40})
	grid.setDisplayOptions({rowHeight:30, fitStyle: "even"})
}

Fn.Array = {
	remove : function(arr, idx){
		arr.splice(idx, 1);
		return arr;
	}
}

Fn.Data = {
	clone : function(data){
		return JSON.parse(JSON.stringify(data));
	},
	getModifiedData : function(before, after){
		var data = {};
		for(var key in before){
			if(before[key] != after[key]){
				data[key] = {key : key, before : before[key], after : after[key]};
			}
		}
		return data;
	},
	copy : function(set, get){
		for(var key in get){
			set[key] = get[key];
		}
		return set;
	}
}

Fn.Date = {
	toString : function(date){
		return date.getFullYear() + "-" + Fn.String.lpad(date.getMonth()+1, 2, "0") + "-" + Fn.String.lpad(date.getDate(), 2, "0");
	},
	toYyyymmdd : function(date){
		return date.getFullYear() + Fn.String.lpad(date.getMonth()+1, 2, "0") + Fn.String.lpad(date.getDate(), 2, "0");
	},
	toYyyymmddhhmi : function(date){
		return date.getFullYear() + Fn.String.lpad(date.getMonth()+1, 2, "0") + Fn.String.lpad(date.getDate(), 2, "0") + Fn.String.lpad(date.getHours(), 2, "0") + Fn.String.lpad(date.getMinutes(), 2, "0");
	},
	toHhmi : function(date){
		return Fn.String.lpad(date.getHours(), 2, "0") + Fn.String.lpad(date.getMinutes(), 2, "0");
	},
	/* Date 에 Month 값 계산 */
	addMonth : function(date, val){
		date.setMonth(date.getMonth()+Number(val))
		return date;
	},
	/* Date 에 Date 값 계산 */
	addDate : function(date, val){
		date.setDate(date.getDate()+Number(val));
		return date;
	},
	calcDate : function(fromDate, toDate){
		var term = Math.ceil(toDate - fromDate);
		return term / 24 / 60 / 60 / 1000;
	},
	toDayString : function(date){
		var days = ["월","화","수","목","금","토","일"];
		return days[date.getDay()-1];
	}
}

Fn.Code = {
	/*
	공통코드 가져오기
	ex) Fn.Code.get([{id:"COM100"}, {id:"COM101"}]);
	return {COM100 : [{label:"", value:""}, {label:"", value:""}], COM101 : [{label:"", value:""}, {label:"", value:""}]}
	*/
	get : function(params){
		var codeDatas = {};
		params = Array.isArray(params) ? params : [params];
		for(var i = 0 ; i < params.length ; i++){
			Fn.Ajax.send({
				url: "/ccd/selectCmnCodeList.do",
				async : false,
				data: {
					upperCodeId : params[i].no,
					groupCd : params[i].groupCd,
					cdDmnNo : params[i].cdDmnNo
				},
				success: function(data) {
					if (data != null) {
						codeDatas[params[i].id || params[i].no] = Fn.Code.getCodeByData(data.cmnCodeList, "codeNm", "codeId");
					} else {
						console.log(params[i].no+" 코드 데이터가 없습니다.");
					}
				}
			});
		}
		Fn.Loading.end();
		return codeDatas;
	},
	getUrl : function(url, params){
		var codeDatas = {};
		params = Array.isArray(params) ? params : [params];
		for(var i = 0 ; i < params.length ; i++){
			Fn.Ajax.send({
				url: url,
				async : false,
				data: {
					upperCodeId : params[i].no
				},
				success: function(data) {
					if (data != null) {
						codeDatas[params[i].id || params[i].no] = Fn.Code.getCodeByData(data.cmnCodeList, "codeNm", "codeId");
					} else {
						console.log(params[i].no+" 코드 데이터가 없습니다.");
					}
				}
			});
		}
		Fn.Loading.end();
		return codeDatas;
	},
	/*
	list<map> 에서 key 값인 것들만 array 로 가져온다
	ex) Fn.Code.getValues([{label:"A", value:"1}, {label:"B", value:"2}], "label");
	return ["A", "B"]
	*/
	getValues : function(datas, key){
		var values = [];
		for(var i = 0 ; i < datas.length ; i++){
			values.push(datas[i][key]);
		}
		return values;
	},
	/*
	list<map> 에서 code 형식으로 바꾼다
	ex) Fn.Code.getCodeByData([{codeNm:"A", codeId:"1}] , "codeNm", "codeId");
	return [{label:"A", value:"1"}]
	*/
	getCodeByData : function(datas, keyId, valueId){
		keyId = keyId || "label";
		valueId = valueId || "value";
		var codes = [];
		for(var i = 0 ; i < datas.length ; i++){
			codes.push({label:datas[i][keyId], value:datas[i][valueId]});
		}
		return codes;
	},
	getLabel : function(datas, value){
		for(var i = 0 ; i < datas.length ; i++){
			if(datas[i].value == value){
				return datas[i].label;
			}
		}
		return "";
	},
	getYears : function(to, from, isAsc){
		var date = new Date();
		var year = date.getFullYear();
		var years = [];
		for(var i = year + to ; i <= year + from ; i++){
			years.push({label : i , value : i });
		}
		if(!isAsc){
			years.sort(function(a, b){
				return a.value < b.value;
			});
		}
		return years;
	},
	getNums : function(fromIdx, toIdx, isAsc){
		var nums = [];
		for(var i = fromIdx; i <= toIdx; i++){
			nums.push({label: i , value: i });
		}
		if(!isAsc){
			nums.sort(function(a, b){
				return a.value < b.value;
			});
		}
		return nums;
	}
}

Fn.Popup = {
	open : function(optn){
		optn = optn || {};
		optn.id = optn.id || "layerPopup";
		optn.url = optn.url || "";
		optn.params = optn.params || {};
		optn.title = optn.title || "";
		optn.width = optn.width || 650;
		optn.height = optn.height || 500;
		optn.top = optn.top || ($(document).height()/2 - optn.height/2);
		optn.left = optn.left || ($(document).width()/2 - optn.width/2);
		optn.modal = optn.modal || false;
		optn.callback = optn.callback || new Function();

		var VC = optn.context;
		VC.createPopup({
			id : optn.id,
			url : optn.url,
			modal : optn.modal,
			width : optn.width,
			params : optn.params,
			onClose : optn.onClose,
		}).open(optn.params);
	},
	close : function(popupId){

	},
}

/* Fn.Popup 을 modal 로 할때 사용한다 */
Fn.Popup.Cover = {
	open : function(popupId){
		var cover = document.createElement("div");
		cover.id = "cover_"+popupId;
		cover.className = "popupCover";

		cover.style.width = $(document).width()+"px";
		cover.style.height = $(document).height()+"px";

		//css
		cover.style.margin = "0px";
		cover.style.padding = "0px";
		cover.style.position = "absolute";
		cover.style.left = "0px";
		cover.style.top = "0px";
		cover.style.backgroundColor = "#d3d3d3";
		cover.style.opacity = "0.5";

		document.body.appendChild(cover);
	},
	close : function(popupId){
		var cover = document.getElementById("cover_"+popupId);
		if(cover){
			document.body.removeChild(cover);
		}
	}
}
//
Fn.SysPopup = {
	open : function(optn){
		optn = optn || {};
		optn.centerBrowser = optn.centerBrowser || 0;
		optn.centerScreen = optn.centerScreen || 0;
		optn.params = optn.params || {};
		optn.location = optn.location || 0;
		optn.menubar = optn.menubar || 0;
		optn.resizable = optn.resizable || 0;
		optn.status = optn.status || 0;
		if(optn.id != "undifined" ){
			optn.name = optn.id;
		} else {
			optn.name = optn.name || this.name;
		}
		optn.url = optn.url || this.href;
		optn.toolbar = optn.toolbar || 0;
		optn.fullscreen = optn.fullscreen || 0;
		optn.title = optn.title || "";
		optn.width = optn.width || 500;
		optn.scrollbars = optn.scrollbars || "no";
		optn.height = optn.height || 500;
		optn.top = optn.top || ($(document).height()/2 - optn.height/2);
		optn.left = optn.left || ($(document).width()/2 - optn.width/2);
		optn.modal = optn.modal || false;
		//
		var windowFeatures =  	'height=' + optn.height +
								',width=' + optn.width +
								',toolbar=' + optn.toolbar +
								',scrollbars=' + optn.scrollbars +
								',status=' + optn.status +
								',resizable=' + optn.resizable +
								',location=' + optn.location +
								',menuBar=' + optn.menubar +
								',fullscreen=' + optn.fullscreen;
		//
		var centeredY,centeredX;
		//
		if(optn.centerBrowser){
			if ($.browser) {//hacked together for IE browsers
				centeredY = (window.screenTop - 120) + ((((document.documentElement.clientHeight + 120)/2) - (optn.height/2)));
				centeredX = window.screenLeft + ((((document.body.offsetWidth + 20)/2) - (optn.width/2)));
			}else{
				centeredY = window.screenY + (((window.outerHeight/2) - (optn.height/2)));
				centeredX = window.screenX + (((window.outerWidth/2) - (optn.width/2)));
			}
			window.open(optn.url, optn.name, windowFeatures+',left=' + centeredX +',top=' + centeredY).focus();
		}else if(optn.centerScreen){
			centeredY = (screen.height - optn.height)/2;
			centeredX = (screen.width - optn.width)/2;
			window.open(optn.url, optn.name, windowFeatures+',left=' + centeredX +',top=' + centeredY).focus();
		}else{
			window.open(optn.url, optn.name, windowFeatures+',left=' + optn.left +',top=' + optn.top).focus();
		}

		//
		var newForm = document.createElement("form");
		newForm.action = optn.url;
		newForm.method = "post";
		newForm.target = optn.name;
		var newHidden = document.createElement("input");
		newHidden.type = "hidden";
		newHidden.name = "params";
		newHidden.value = JSON.stringify(optn.params);
		newForm.appendChild(newHidden);
		document.body.appendChild(newForm);
		newForm.submit();
		document.body.removeChild(newForm);
	},

	close : function(name,data){
		$(opener.location).attr("href", "javascript:"+name+"(" + JSON.stringify(data) + ");")
		 window.close();
	},
}

Fn.Number = {
	setComma : function(value){
		value = String(value);
		var regExp = /(^[+-]?\d+)(\d{3})/;
		while(regExp.test(value)){
			value = value.replace(regExp, "$1" + "," + "$2");
		}
		return value;
	}
}

Fn.String = {
	/* String 의 바이트 길이.
	 * Cubrid DB 특성상 문자에 상관없이 varchar(10) 이면 10자가 입력되므로 오라클을 위한 길이는 필요없어 수정 */
	getByteLength : function(str){
//		var asciiLength = str.match(/[\u0000-\u007f]/g) ? str.match(/[\u0000-\u007f]/g).length : 0;
//		var multiByteLength = encodeURI(str.replace(/[\u0000-\u007f]/g)).match(/%/g) ? encodeURI(str.replace(/[\u0000-\u007f]/g, '')).match(/%/g).length : 0;
//		return asciiLength + multiByteLength;

		return (str ? str.length : 0);
	},
	toDate : function(str){
		return $.datepicker.parseDate("yy-mm-dd", str);
	},
	formatDate : function(str){
		if(str.length > 4){
			str = str.substring(0,4) + "-" + str.substring(4);
			if(str.length > 7){
				str = str.substring(0,7) + "-" + str.substring(7);
				if(str.length > 10){
					str = str.substring(0,10);
				}
			}

		}
		return str;
	},
	formatTime : function(str){
		if(str.length > 2){
			str = str.substring(0,2) + ":" + str.substring(2);
			if(str.length > 5){
				str = str.substring(0,5) + ":" + str.substring(5);
			}
		}
		return str;
	},
	formatDatetime : function(str, format){
		if(str.length > 4){
			str = str.substring(0,4) + "-" + str.substring(4);
			if(str.length > 7){
				str = str.substring(0,7) + "-" + str.substring(7);
				if(str.length > 10){
					str = str.substring(0,10) + " " + str.substring(10);
					if(str.length > 13){
						str = str.substring(0,13) + ":" + str.substring(13);
						if(str.length > 16){
							str = str.substring(0,16) + ":" + str.substring(16);
						}
					}
				}
			}
		}
		return str;
	},
	formatDateByNewDate : function(str){
		var temp = new Date(str);
		//
		if(temp == "Invalid Date"){
			return "";
		}
		//
		var year = temp.getFullYear();
		var month = temp.getMonth()+1;
		var date = temp.getDate();
		//
		if(month < 10){
			month = "0"+month;
		}
		if(date < 10){
			date = "0"+date;
		}
		return 	year+"-"+month+"-"+date
	},
	lpad : function(str, len, chr){
		str = String(str);
		len = Number(len);
		for(var i = str.length ; i < len ; i++){
			str = chr + str;
		}
		return str;
	},
	rpad : function(str, len, chr){
		for(var i = str.length ; i < len ; i++){
			str = str + chr;
		}
		return str;
	},
	isBlank : function(str){
		if(str == "" || str == null || str == undefined){
			return true;
		}else{
			return false;
		}
	},
	defBlank : function(str){
		if(!Fn.String.isBlank(str)){
			return str;
		}else{
			return "";
		}
	}
}

Fn.Grid.Validate = {
	/* 그리드의 바이트 길이 체크 - optn.column[i].length 값으로 체크한다*/
	checkByte : function(grid){
		var datas = Fn.Grid.getDatas(grid);
		for(var i = 0 ; i < datas.length ; i++){
			console.log(datas[i].rowStatus);
			if(datas[i].rowStatus != "deleted"){
				var check = Fn.Grid.Validate.checkByteRow(grid, datas[i]);
				if(check){
					return check;
				}
			}
		}
	},
	checkByteRow : function(grid, values){
		var fields = grid.getDataProvider().getFields();
		var value = "";
		var byteLength;
		for(var i = 0 ; i < fields.length ; i++){
			if(fields[i].length > 0){
				value = values[fields[i].orgFieldName] || "";
				if(fields[i].dataType == "textDate"){
					value = value.replace(/-/gi, "");
				}
				if(fields[i].dataType == "textDatetime"){
					value = value.replace(/-/gi, "").replace(/:/gi, "");
				}
				if(fields[i].dataType == "textTime"){
					value = value.replace(/:/gi, "");
				}
				if(!value){
					continue;
				}
				byteLength = Fn.String.getByteLength(value);
				if(byteLength > fields[i].length){
					return {
						fieldName : fields[i].orgFieldName,
						text : grid.columnByField(fields[i].orgFieldName).header.text,
						maxLength : fields[i].length,
						byteLength : byteLength
					}
				}
			}
		}
	},
	checkRequired : function(grid){
		var cells = grid.checkValidateCells();
		if(cells){
			for(var i = 0 ; i < cells.length ; i++){
				var rowStatus = Fn.Grid.getRowState(grid, cells[i].dataRow);
				if(rowStatus != "deleted"){
					return cells[i];
				}
			}
		}
	},
	check : function(gv){
		var check = Fn.Grid.Validate.checkRequired(gv);
		if(check){
			check = Array.isArray(check) ? check : [check];
			alert(check[0].message);
			return true;
		}
		var check = Fn.Grid.Validate.checkByte(gv);
		if(check){
			alert(check.text + " 값은 " + check.maxLength + "byte를 초과 할 수 없습니다.");
			return true;
		}
		return false;
	}
}

Fn.Element = {
	/* Element 를 가져온다 */
	get : function(optn){
		var ele;
		if(optn.element){
			ele = optn.element;
		}else if(optn.elements){
			ele = optn.elements;
		}else if(optn.id){
			ele = document.getElementById(optn.context ? optn.context.real(optn.id) : optn.id);
		}else if(optn.name){
			ele = document.getElementsByName(optn.name);
		}else if(optn.className){
			ele = document.getElementsByClassName(optn.className);
		}
		return ele;
	},
	/*코드 세팅을 element 에 맞추어 처리해준다.*/
	setDatas : function(optn){
		var ele = Fn.Element.get(optn);
		if(ele.tagName.toLowerCase() == "select"){
			Fn.SelectBox.setDatas(optn);
		}else if(ele.type.toLowerCase() == "radio"){
			Fn.RadioBox.setDatas(optn);
		}else if(ele.type.toLowerCase() == "checkbox"){
			Fn.CheckBox.setDatas(optn);
		}
	}
}

Fn.Table = {
	/* 참조 : /ncp/WebContent/sample/sample.html */
	/*
	그리드의 정보 상세 보기 생성
	- optn.id : 테이블 id
	- optn.grid : 참조될 그리드
	- fields : 그리드에서 상세로 보여질 필드 정보 리스트
	- fields[i].name : 그리드에서 매핑될 field name
	- fields[i].label : 테이블에 보여질 항목명
	- fields[i].type : 테이블에 보여질 표시형식 (text, select, radio, checkbox, textarea)
	- fields[i].datas : fields[i].type 이 [select, radio, checkbox] 일때 보여질 코드 값
	- fields[i].isRequired : 필수 체크 (default:false)
	- fields[i].isReadOnly : 읽기 전용, 수정 불가 (default:false)
	- fields[i].length : 바이트 체크할 사이즈 (default:체크안함)
	ex) Fn.Table.create({
			id : "tbDetail",
			grid : gridView,
			fields : [
				{name:"text", label:"text", type:"text", isRequired : true, isReadOnly : true, length : 5},
				{name:"select", label:"select", type:"select", datas : codeDatas.COM100, isRequired : true},
				{name:"radio", label:"radio", type:"radio", datas : codeDatas.COM100, isRequired : true},
				{name:"checkbox", label:"checkbox", type:"checkbox", datas : codeDatas.COM100, isRequired : true},
				{name:"textarea", label:"textarea", type:"textarea", isRequired : true, length : 10},
			]
		});
	*/
	/* 제외.. Fn.Grid.bind 로 대체 사용
	create : function(optn){
		var table;
		table = Fn.Element.get(optn);
		optn.fields = optn.fields || [];

		// Grid Row Change Event
		if(optn.grid){
			optn.grid.onCurrentRowChanged = function(grid, oldRow, newRow){
				if(newRow > -1){
					Fn.Table.setDataByName({id:optn.id, data:Fn.Grid.Focus.getRowData(grid)});
				}else{
					Fn.Table.setDataByName({id:optn.id});
				}
			}
		}

		var field, row, cell;
		for(var i = 0 ; i < optn.fields.length ; i++){
			field = optn.fields[i];

			if(i%2 == 0){
				row = table.insertRow();
			}

			cell = row.insertCell();
			if(field.isRequired){
				cell.innerHTML = "<span class='required'>*</span>" + field.label;
			}else{
				cell.innerHTML = field.label;
			}

			cell = row.insertCell();
			var createOption = {
				parentElement : cell,
				name : field.name,
				codeId : field.codeId,
				datas : field.datas,
				maxLength : field.length
			}

			// Grid setValue 처리
			if(optn.grid){
				createOption.onchange = function(e){
					console.log(this.name);
					Fn.Grid.setCellData(optn.grid, Fn.Grid.Focus.getIndex(optn.grid).rowIndex, this.name, this.value);
				}
			}
			if(field.isReadOnly){
				createOption.disabled = true;
			}
			if(field.type == "select"){
				Fn.SelectBox.create(createOption);
			}else if(field.type == "radio"){
				Fn.RadioBox.create(createOption);
			}else if(field.type == "checkbox"){
				Fn.CheckBox.create(createOption);
			}else if(field.type == "checkbox"){
				Fn.CheckBox.create(createOption);
			}else if(field.type == "textarea"){
				Fn.Textarea.create(createOption);
			}else if(field.type == "image"){
				Fn.Image.create(createOption);
			}else if(field.type == "file"){
				Fn.File.create(createOption);
			}else{
				Fn.Text.create(createOption);
			}
		}
	},
	*/
	/*
	그리드의 데이터를 생성된 상세보기 <table> 에 element 들의 name 값 기준으로 value 를  설정한다
	- optn.[ id | element | name ] : 상세보기 table id
	- optn.data : 상세보기에 설정될 데이터
	*/
	setDataByName : function(optn){
		optn = optn || {};
		var table;
		table = Fn.Element.get(optn);

		var elements;
		for(var key in optn.data){
			elements = $(table).find("[name="+key+"]");
			if(elements.length > 0){
				if(elements[0].tagName.toLowerCase() == "input"){
					if(elements[0].type.toLowerCase() == "text"){
						elements.val(optn.data[key]);
					}else if(elements[0].type.toLowerCase() == "radio"){
						Fn.RadioBox.setValue({elements:elements, value:optn.data[key]});
					}else if(elements[0].type.toLowerCase() == "checkbox"){
						Fn.CheckBox.setValue({elements:elements, values:optn.data[key].split(",")});
					}
				}else if(elements[0].tagName.toLowerCase() == "select"){
					elements.val(optn.data[key]);
				}else if(elements[0].tagName.toLowerCase() == "textarea"){
					elements.val(optn.data[key]);
				}else if(elements[0].tagName.toLowerCase() == "file"){
					//elements.val(optn.data[key]);
				}
			}
		}
	},
	/*
	상세보기에 입력된 데이터 유효성 체크
	필수 체크 : 항목명(label)에 className 이 "required" 인  element 가 있을 경우
	바이트 체크 : element 에 maxLength 속성이 있을 경우
	- optn.[ id | element | name ] : 상세보기 table id
	*/
	validate : function(optn){
		var table = Fn.Element.get(optn);
		for(var i = 0 ; i < table.rows.length ; i++){
			var row = table.rows[i];
			for(var j = 0 ; j < row.cells.length ; j++){
				var cell = row.cells[j];
				var label, required;
//				if(j%2 == 0){
				if($(cell).hasClass("e")){					//
					//required = cell.getElementsByClassName("required").length > 0 ? true : false;
					required = $(cell).hasClass("e");
					//label = cell.lastChild.data;
					//label = cell.firstChild.data;
					label = cell.innerText.trim();
					//
				}else{
					if(cell.children.length > 0){
						for(var k = 0 ; k < cell.children.length ; k++){
							var children = cell.children[k];
							var value;
							// tb > 하위노드 밑에  input이 있는경우
							if($(children).find("input").length > 0){
								$(children).find("input").each(function(idx,ele){
									value = ele.value;
									//
								});
							}
							if(children.tagName.toLowerCase() == "input"){
								//2018.12.13
								if(children.className.indexOf("unvalidate") > -1){
									//next
								}else if(children.className.indexOf("validate") > -1){
									value = children.value;
								}else{
									if(children.type.toLowerCase() != "hidden"){
										value = children.value;
									}
								}

							}else if(children.tagName.toLowerCase() == "select"){
								value = children.value;
							}else if(children.tagName.toLowerCase() == "textarea"){
								value = children.value;
							}else if(children.tagName.toLowerCase() == "label"){
								if(children.children[0].type.toLowerCase() == "radio"){
									if(children.children[0].name){
										value = Fn.RadioBox.getValue({name:children.children[0].name});
									}else{
										value = Fn.RadioBox.getValue({id:children.children[0].id});
									}
								}else if(children.children[0].type.toLowerCase() == "checkbox"){
									if(children.children[0].name){
										value = Fn.CheckBox.getValue({name:children.children[0].name}).toString();
									}else{
										value = Fn.CheckBox.getValue({id:children.children[0].id}).toString();
									}
								}
							}
							// 필수 체크
							if(required){
								if(value == ""){
									alert(label + " 값은 반드시 필요합니다.");
									return true;
								}
							}

							//byte size 체크
							if(children.maxLength && children.maxLength > 0){
								var byteLength = value ? Fn.String.getByteLength(value) : 0;
								if(byteLength > children.maxLength){
									alert(label + " 값은 " + children.maxLength + "byte를 초과 할 수 없습니다.");
									return true;
								}
							}
						}
					}else{
						required = false;
						//2018.12.05 추가... class="e" 가 없으면 maxLength 체크시 label 값을 못 가져온다....
						label = cell.innerText.trim();
					}
				}
			}
		}
		return false;
	},
	setEnterEvent : function(optn){
		var VC = optn.context;
		var table = Fn.Element.get(optn);
		$(table).find("input:text").each(function(idx,ele){
			$(ele).on("keydown", function(e){
				if(e.keyCode == 13){
					//console.log("enter keydown !!");
					if(optn.callback){
						optn.callback();
					}else{
						VC.fnSearch();
					}
				}
			});
		});
	},
	disabled : function(optn){
		var table = Fn.Element.get(optn);

		var inputs = table.getElementsByTagName("input");
		for(var i = 0 ; i < inputs.length ; i++){
			inputs[i].disabled = "disabled";
		}

		var inputs = table.getElementsByTagName("select");
		for(var i = 0 ; i < inputs.length ; i++){
			inputs[i].disabled = "disabled";
		}

		var inputs = table.getElementsByTagName("textarea");
		for(var i = 0 ; i < inputs.length ; i++){
			inputs[i].disabled = "disabled";
		}

		var inputs = table.getElementsByTagName("a");
		for(var i = 0 ; i < inputs.length ; i++){
			$(inputs[i]).off("click");
		}
	},
	abled : function(optn){
		var table = Fn.Element.get(optn);

		var inputs = table.getElementsByTagName("input");
		for(var i = 0 ; i < inputs.length ; i++){
			inputs[i].removeAttribute("disabled");
		}

		var inputs = table.getElementsByTagName("select");
		for(var i = 0 ; i < inputs.length ; i++){
			inputs[i].removeAttribute("disabled");
		}

		var inputs = table.getElementsByTagName("textarea");
		for(var i = 0 ; i < inputs.length ; i++){
			inputs[i].removeAttribute("disabled");
		}
	}
}

Fn.Text = {
	create : function(optn){
		optn = optn || {};
		var text = document.createElement("input");
		for(var key in optn){
			text[key] = optn[key];
		}
		optn.parentElement.appendChild(text);
	},
	getValue : function(optn){
		var ele;
		ele = Fn.Element.get(optn);
		return ele.value;
	}
}

Fn.Textarea = {
	create : function(optn){
		optn = optn || {};
		var textarea = document.createElement("textarea");
		for(var key in optn){
			textarea[key] = optn[key];
		}
		optn.parentElement.appendChild(textarea);
	},
	getValue : function(optn){
		var ele;
		ele = Fn.Element.get(optn);
		return ele.value;
	}
}

Fn.SelectBox = {
	/*
	select 생성
	- optn.parentElement : 생성된 select 를 append 할 element
	- optn.[ datas | codeId ] : option 에 들어갈 code 값들 또는 공통코드 id
	- optn.[ id | name | ... ] : 생성된 select 에 들어갈 기타 attribute 값
	*/
	create : function(optn){
		optn = optn || {};
		optn.datas = optn.datas || [];
		if(optn.codeId){
			optn.datas = Fn.Code.get({no:optn.codeNo,id:optn.codeId})[optn.codeId];
		}
		var selectBox = document.createElement("select");

		optn.element = selectBox;
		selectBox = Fn.SelectBox.setDatas(optn);
		if(optn.parentElement){
			if(typeof optn.parentElement == 'string'){
				optn.parentElement = Fn.Element.get({ context: optn.context, id: optn.parentElement });
			}
			optn.parentElement.appendChild(selectBox);
		}
		if(optn.onchange){
			selectBox.onchange = optn.onchange;
		}
		return selectBox;
	},
	setDatas : function(optn){
		optn = optn || {};
		optn.isAll = optn.isAll == undefined ? false : optn.isAll;
		var selectBox = Fn.Element.get(optn);
		if(selectBox.tagName.toLowerCase() != "select"){
			console.error("[" + (optn.name || optn.id) + "] element 타입이 select 가 아닙니다.");
		}
		for(var key in optn){
			/* 아래 속성들은 요소에 설정하지 않는다. */
			if("datas,codeId,context,labelName,valueName,parentElement,isAll".indexOf(key) > -1) continue;

			if(key == 'id' && optn.context){
				selectBox[key] = optn.context.real(optn[key]);
			}else{
				selectBox[key] = optn[key];
			}
		}
		var option;
		if(optn.isAll == true){
			option = document.createElement("option");
			option.text = "-전체-";
			option.value = "all";
			selectBox.appendChild(option);
		}
		if(optn.isAll == false){
			option = document.createElement("option");
			option.text = "-선택-";
			option.value = "";
			selectBox.appendChild(option);
		}
		if(optn.datas != undefined)
		{
			var labelAttr = optn.labelName || 'label';
			var valueAttr = optn.valueName || 'value';
			for(var i = 0 ; i < optn.datas.length ; i++){
				option = document.createElement("option");
				option.text = optn.datas[i][labelAttr];
				option.value = optn.datas[i][valueAttr];
				selectBox.appendChild(option);
			}
		}
		return selectBox;
	},
	getValue : function(optn){
		var ele;
		ele = Fn.Element.get(optn);
		return ele.value;
	}
}

Fn.RadioBox = {
	/*
	radio 생성
	- optn.parentElement : 생성된 radio 를 append 할 element
	- optn.[ datas | codeId ] : radio 에 들어갈 code 값들 또는 공통코드 id
	- optn.[ id | name | ... ] : 생성된 radio 에 들어갈 기타 attribute 값
	*/
	create : function(optn){
		optn = optn || {};
		var radio;

		radio = document.createElement("input");
		radio.type = "radio";
		for(var key in optn){
			radio[key] = optn[key];
		}

		if(optn.parentElement){
			optn.parentElement.appendChild(radio);
		}

		optn.element = radio;
		return Fn.RadioBox.setDatas(optn);
	},
	setDatas : function(optn){
		optn = optn || {};
		optn.isAll = optn.isAll == undefined ? false : optn.isAll;
		optn.datas = optn.datas || [];

		var elements = [];

		if(optn.codeId){
			optn.datas = Fn.Code.get({no:optn.codeNo,id:optn.codeId})[optn.codeId];
		}
		var element = Fn.Element.get(optn);
		if(element.type.toLowerCase() != "radio"){
			console.error("[" + (optn.name || optn.id) + "] element 타입이 radio 가 아닙니다.");
		}
		var parentElement = element.parentElement || optn.parentElement;
		if(parentElement){
			element.parentElement.removeChild(element);
		}

		var label, radio;
		if(optn.isAll){
			label = document.createElement("label");
			radio = element.cloneNode(true);
			for(var key in optn){
				radio[key] = optn[key];
			}
			radio.value = "all";
			radio.checked = true;
			label.appendChild(radio);
			$(label).append("전체");
			elements.push(label);
		}
		if(optn.datas != undefined)
		{
			for(var i = 0 ; i < optn.datas.length ; i++){
				label = document.createElement("label");
				radio = element.cloneNode(true);
				for(var key in optn){
					radio[key] = optn[key];
				}
				radio.value = optn.datas[i].value;
				//radio.removeAttribute("id");
				/////radio.id = radio.id+"-"+radio.value;
				label.appendChild(radio);
				$(label).append(optn.datas[i].label);
				elements.push(label);
			}
			if(parentElement){
				for(var i = 0 ; i < elements.length ; i++){
					parentElement.appendChild(elements[i]);
				}
			}
		}

		return elements;
	},
	getValue : function(optn){
		var eles;
		if(optn.element){
			eles = optn.element;
		}else if(optn.id){
			eles = document.querySelectorAll("#" + (optn.context ? optn.context.real(optn.id) : optn.id));
		}else if(optn.name){
			eles = Fn.Element.get(optn);
		}
		var val = "";
		for(var i = 0 ; i < eles.length ; i++){
			if(eles[i].checked){
				val = eles[i].value;
				break;
			}
		}
		return val;
	},
	setValue : function(optn){
		var eles;
		if(optn.element){
			eles = optn.element;
		}else if(optn.id){
			eles = document.querySelectorAll("#" + (optn.context ? optn.context.real(optn.id) : optn.id));
		}else if(optn.name){
			eles = Fn.Element.get(optn);
		}
		for(var i = 0 ; i < eles.length ; i++){
			if(eles[i].value == optn.value){
				eles[i].checked = true;
				break;
			}
		}
	},
	clear : function(optn){
		var eles;
		eles = Fn.Element.get(optn);
		for(var i = 0 ; i < eles.length ; i++){
			eles[i].checked = false;
		}
	}
}

Fn.CheckBox = {
	/*
	checkbox 생성
	- optn.parentElement : 생성된 checkbox 를 append 할 element
	- optn.[ datas | codeId ] : checkbox 에 들어갈 code 값들 또는 공통코드 id
	- optn.[ id | name | ... ] : 생성된 checkbox 에 들어갈 기타 attribute 값
	*/
	create : function(optn){
		optn = optn || {};
		var checkbox;

		checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		for(var key in optn){
			checkbox[key] = optn[key];
		}

		if(optn.parentElement){
			optn.parentElement.appendChild(checkbox);
		}

		optn.element = checkbox;
		return Fn.CheckBox.setDatas(optn);
	},
	setDatas : function(optn){
		optn = optn || {};
		optn.isAll = optn.isAll == undefined ? false : optn.isAll;
		optn.datas = optn.datas || [];

		var elements = [];

		if(optn.codeId){
			optn.datas = Fn.Code.get({no:optn.codeNo,id:optn.codeId})[optn.codeId];
		}
		var element = Fn.Element.get(optn);
		if(element.type.toLowerCase() != "checkbox"){
			console.error("[" + (optn.name || optn.id) + "] element 타입이 checkbox 가 아닙니다.");
		}
		var parentElement = element.parentElement || optn.parentElement;
		if(parentElement){
			element.parentElement.removeChild(element);
		}

		var label, checkbox;
		if(optn.isAll){
			label = document.createElement("label");
			checkbox = element.cloneNode(true);
			for(var key in optn){
				checkbox[key] = optn[key];
			}
			checkbox.name = "all";
			checkbox.onchange = function(e){
				var checkboxs = this.parentElement.parentElement.querySelectorAll("#"+this.id);
				for(var i = 0 ; i < checkboxs.length ; i++){
					checkboxs[i].checked = this.checked;
				}
			}
			label.appendChild(checkbox);
			$(label).append("전체");
			elements.push(label);
		}

		if(optn.datas != undefined)
		{
			for(var i = 0 ; i < optn.datas.length ; i++){
				label = document.createElement("label");
				checkbox = element.cloneNode(true);
				for(var key in optn){
					checkbox[key] = optn[key];
				}
				checkbox.name = optn.name || optn.id;
				checkbox.value = optn.datas[i].value;
				label.appendChild(checkbox);
				$(label).append(optn.datas[i].label);
				elements.push(label);
			}
			if(parentElement){
				for(var i = 0 ; i < elements.length ; i++){
					parentElement.appendChild(elements[i]);
				}
			}
		}
		return elements;
	},
	getValue : function(optn){
		var eles = [];
		if(optn.element){
			eles = optn.element;
		}else if(optn.id){
			eles = document.querySelectorAll("#" + (optn.context ? optn.context.real(optn.id) : optn.id));
		}else if(optn.name){
			eles = Fn.Element.get(optn);
		}
		var val = [];
		for(var i = 0 ; i < eles.length ; i++){
			if(eles[i].name != "all" && eles[i].checked){
				val.push(eles[i].value);
			}
		}
		return val;
	},
	setValue : function(optn){
		//clear
		Fn.CheckBox.clear(optn);
		optn.value = Array.isArray(optn.value) ? optn.value : [optn.value];
		var eles = [];
		if(optn.element){
			eles = optn.element;
		}else if(optn.id){
			eles = document.querySelectorAll("#" + (optn.context ? optn.context.real(optn.id) : optn.id));
		}else if(optn.name){
			eles = Fn.Element.get(optn);
		}
		for(var i = 0 ; i < eles.length ; i++){
			for(var j = 0 ; j < optn.value.length ; j++){
				if(eles[i].value == optn.value[j]){
					eles[i].checked = true;
				}
			}
		}
	},
	clear : function(optn){
		var eles;
		eles = Fn.Element.get(optn);
		for(var i = 0 ; i < eles.length ; i++){
			eles[i].checked = false;
		}
	}
}

Fn.Image = {
	/*
	image file 생성
	- optn.parentElement : 생성된 image file 를 append 할 element
	- optn.isPreview : image file 미리보기 설정
	- optn.isMultiple : image file 다중 업로드 설정
	- optn.[ id | name | ... ] : 생성된 image file 에 들어갈 기타 attribute 값
	*/
	create : function(optn){
		optn = optn || {};
		optn.isPreview = optn.isPreview == undefined ? true : false;
		optn.isMultiple = optn.isMultiple == undefined ? false : true;
		var image = document.createElement("input");
		image.type = "file";
		image.multiple = optn.isMultiple;
		for(var key in optn){
			image[key] = optn[key];
		}
		optn.parentElement.appendChild(image);

		if(optn.isPreview){
			var btn = document.createElement("input");
			btn.type = "button";
			btn.value = "preview";
			btn.addEventListener("click", function(e){
				var image = this.previousSibling;
				Fn.Image.preview({
					files : image.files,
					context: optn.context,
					left : $(this).position().left,
					top : $(this).position().top + this.offsetHeight
				});
			}, false);
			optn.parentElement.appendChild(btn);
		}
	},
	/*
	이미지 미리보기
	- optn.files : 이미지 파일 리스트
	- optn.left : 미리보기 위치 left
	- optn.top : 미리보기 위치 top
	*/
	preview : function(optn){
		optn = optn || {};
		optn.left = optn.left || 0;
		optn.top = optn.top || 0;
		var div = document.getElementById(optn.context ? optn.context.real("divPreview") : "divPreview");
		if(div){
			div.innerHTML = "";
		}else{
			div = document.createElement("div");
			div.id = optn.context ? optn.context.real("divPreview") : "divPreview";
		}
		div.style.position = "absolute";
		div.style.left = optn.left+"px";
		div.style.top = optn.top+"px";

		var file, reader;
		for(var i = 0 ; i < optn.files.length ; i++){
			file = optn.files[i];
			reader = new FileReader();
			reader.onload = function(e){
				var image = document.createElement("input");
				image.type = "image";
				image.src = e.target.result;
				image.onload = function(e){
					//미리보기 최대 사이즈 조절
					var maxWidth = 50;
					var maxHeight = 50;
					var ratio = 0;
					if(this.width > maxWidth){
						ratio = maxWidth / this.width;
						this.width = maxWidth;
						//this.height = this.height * ratio;
					}
					if(this.height > maxHeight){
						ratio = maxHeight / this.height;
						this.height = maxHeight;
						//this.width = this.width * ratio;
					}
				}
				image.onclick = function(e){
					this.parentElement.remove();
				}
				div.appendChild(image);
			}
			reader.readAsDataURL(file);
		}
		document.body.appendChild(div);
	}
}

var callmap = {};
Fn.File = {

	COL_SECD : 'SECD',
	COL_NAME : 'NAME',
	COL_SIZE : 'SIZE',
	COL_DESC : 'DESC',
	COL_RGTR : 'RGTR',
	COL_RGDT : 'RGDT',
	COL_DELT : 'DELT',

	// formid : 어느곳에 위치, filId : 파일ID, formId : 다른파일업로드폼과 구분하기 위한 숫자
	simpleForm : function(formid, filId, filSn, init, callback)
	{
		var initid = 'init' + formid;
		var callid = 'callback' + formid;
		callmap[initid] = init;
		callmap[callid] = callback;

		$.ajax(
		{
	        url : '/file/simpleForm.do?formid=' + formid + '&filId=' + filId + '&filSn=' + filSn,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
	        	$('#' + formid).append(data);
	        	$('#fileId' + formid).val(filId);
	        	$('#fileSn' + formid).val(filSn);
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
	        		alert('파일 업로드 컴포넌트 초기화중 오류가 발생했습니다.');
	        	}
	        	Fn.Loading.end();
	        }
	    });
	},
	simpleForm1 : function(formid, filId, fileName, init, callback)
	{
		var initid = 'init' + formid;
		var callid = 'callback' + formid;
		callmap[initid] = init;
		callmap[callid] = callback;

		$.ajax(
		{
	        url : '/file/simpleForm1.do?formid=' + formid + '&filId=' + filId,
	        type : 'post',
	        async : true,
	        data : 'fileName=' + fileName,
	        success: function(data, textStatus, xhr)
			{
	        	$('#' + formid).append(data);
	        	$('#fileId' + formid).val(filId);
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
	        		alert('파일 업로드 컴포넌트 초기화중 오류가 발생했습니다.');
	        	}
	        	Fn.Loading.end();
	        }
	    });
	},
	multiForm : function(formid, filId, init, callback)
	{
		var initid = 'init' + formid;
		if(!filId || filId == undefined){
			filId = '';
		}
		var callid = 'callback' + formid;
		callmap[initid] = init;
		callmap[callid] = callback;
		var readonly = $('#' + formid).data('readonly');
		$.ajax(
		{
	        url : '/file/multiForm.do?formid=' + formid + '&filId=' + filId + '&readonly=' + readonly,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
	        	$('#' + formid).append(data);
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
	        		alert('파일 업로드 컴포넌트 초기화중 오류가 발생했습니다.');
	        	}
	        	Fn.Loading.end();
	        }
	    });
	},
	tableForm : function(formid, fileInfo, filId, init, callback)
	{
		var table = $("<table>", {'id':formid+'tbl'});
		$('#' + formid).append(table);
		var row = $("<tr></tr>");
		table.append(row);
		for(i = 0; i < 3; i++)
		{
			if(i == 0) title = '등록일자'; else if(i == 1) title = '파일명'; else if(i == 2) title = '관리';
			var col = $("<th/>", {'text':title});
			row.append(col);
		}

		var filSns = fileInfo.keys();
		$(filSns).each(function(idx, filSn)
		{
			var row = $("<tr></tr>");
			table.append(row);

			var cls = '';
			for(i = 0; i < 3; i++)
			{
				if(i == 0) cls = 'rgstDt'; else if(i == 1) cls = 'orgFilNm'; else if(i == 2) cls = 'mgr';
				var col = $("<td/>", {'class':cls, 'html':'&nbsp;'});
				row.append(col);
			}

			var initid = 'init' + formid + filId + filSn;
			var callid = 'callback' + formid + filId + filSn;
			callmap[initid] = init;
			callmap[callid] = callback;
			//var readonly = $('#' + formid).data('readonly');

			$.ajax(
			{
		        url : '/file/tableForm.do?filId=' + filId + '&formid=' + formid + '&filSn=' + filSn,
		        type : 'post',
		        async : true,
		        data : 'btnName=' + fileInfo.get(idx+1),
		        success: function(data, textStatus, xhr)
				{
		        	$('#' + formid).append($("<div/>", {'id':'file' + formid + filId + filSn}).append(data));
		        },
		        error: function(xhr, textStatus, errorThrown)
		        {
					var response = null;
					try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
		        	if(response.errorStack){
		        		fnException(response);
		        	}else{
		        		alert('파일 업로드 컴포넌트 초기화중 오류가 발생했습니다.');
		        	}
		        	Fn.Loading.end();
		        }
		    });
		});

		//$('#filId' + formid).val(filId);
	},
	dynamicForm : function(optn)
	{
		callmap['init' + optn.formid] = optn.onInit;
		callmap['validation' + optn.formid] = optn.validation;
		callmap['callback' + optn.formid] = optn.onUploadComplete;

		if(!optn.filId || optn.filId == undefined){
			optn.filId = '';
		}

		$.ajax(
		{
	        url : '/file/dynamicForm.do?formid=' + optn.formid + '&filId=' + optn.filId + '&readonly=' + optn.readonly,
	        type : 'post',
	        async : true,
	        data : 'includeHeads=' + JSON.stringify(optn.includeHeads) /*+ '&excludeHeads=' + JSON.stringify(optn.excludeHeads)*/,
	        success: function(data, textStatus, xhr)
			{
	        	$('#' + optn.formid).append(data);
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
	        		alert('파일 업로드 컴포넌트 초기화중 오류가 발생했습니다.');
	        	}
	        	Fn.Loading.end();
	        }
	    });
	},
	downloadFile : function(filId, filSn)
	{
		//location.href = '/file/fileDownload.do';
		if(filId == null || filId == "" || filId == undefined || filId == "undefined" ){
			alert("파일아이디가 없습니다.");
			return;
		}

		if(filSn == null || filSn == "" || filSn == undefined || filSn == "undefined" ){
			alert("파일순번이 없습니다.");
			return;
		}

		var downUrl = '/file/fileDownload.do';

		if($("body").length > 0){//임시 form submit 그리고 임시form 삭제
			//form submit 할 임시 form 및 attribute 생성
			$("body").append("<form action='"+ downUrl +"' method='post' name='file_"+filId+"_"+filSn+"_Frm'></form>");
			$("form[name=file_"+filId+"_"+filSn+"_Frm]").append("<input type='text' name='filId' value='"+filId+"'>")
														.append("<input type='text' name='filSn' value='"+filSn+"'>");
			$("form[name=file_"+filId+"_"+filSn+"_Frm]").submit().remove();
		}else{
			window.open(downUrl+"?filId="+filId+"&filSn="+filSn, "file_dwon_form", "width=300, height=200, toolbar=no, menubar=no, scrollbars=no, resizable=yes" );
		}
	},
	selectFileList : function(formid, filId)
	{
		$('#fileInfo' + formid).html('');
		$.ajax({
	        url : '/file/selectFileList.do?filId=' + filId,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
				$.each(data.fileList, function(key, value)
				{
					$('#fileInfo' + formid).append(
					  "<li>"
					+ "<ul>"
					+ "	<li id='dwn" + formid + key + "'></li>"
					+ "	<li id='filMgVal" + formid + key + "'>" + value.filMgVal + "</li>"
					+ "	<li id='rgster" + formid + key + "'>" + value.rgstrId + "</li>"
					+ "	<li id='rgstDt" + formid + key + "'>" + value.rgstDt + "</li>"
					+ "	<li id='del" + formid + key + "'></li>"
					+ "</ul>"
					+ "</li>"
					);
					$("<a>", {text:value.orgFilNm, click:function() {Fn.File.downloadFile(value.filId, value.filSn)}}).appendTo('#dwn' + formid + key);
					// '" + value.filId + ', ' + value.filSn + "
					$("<a>", {text:'삭제', 'class':'g_btn_del', click:function() {Fn.File.deleteFile(value.filId, value.filSn, formid) }}).appendTo('#del' + formid + key);
					// " + value.filId + "," + value.filSn + ",\'" + formid + "\'
	       		});

				if($('#' + formid + 'filMgVal').css('display') == 'none')
				{
					$("li[id^='filMgVal" + formid + "']").css('display', 'none');
				}
				if($('#' + formid + 'rgster').css('display') == 'none')
				{
					$("li[id^='rgster" + formid + "']").css('display', 'none');
				}
				if($('#' + formid + 'rgstDt').css('display') == 'none')
				{
					$("li[id^='rgstDt" + formid + "']").css('display', 'none');
				}
				if($('#' + formid + 'filDel').css('display') == 'none')
				{
					$("li[id^='del" + formid + "']").css('display', 'none');
				}
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
					alert('파일 조회중 오류가 발생했습니다.');
				}
				Fn.Loading.end();
	        }
	    });
	},
	selectFileList2 : function(formid, filId)
	{
		$('#fileInfo' + formid).html('');
		$.ajax({
	        url : '/file/selectFileList.do?filId=' + filId,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
				$.each(data.fileList, function(key, value)
				{
					$('#fileInfo' + formid).append(
					  "<li>"
					+ "<ul>"
					+ "<li id='dwn" + formid + key + "'>"
					+ "<li id='del" + formid + key + "'>"
					+ "</li>"
					+ "</ul>"
					+ "</li>"
					);
					$("<a>", {text:value.orgFilNm, click:function() {Fn.File.downloadFile(value.filId, value.filSn)}}).appendTo('#dwn' + formid + key);
					// '" + value.filId + ', ' + value.filSn + "
					$("<span/>", {text:'삭제', 'class':'g_btn_del', click:function() {Fn.File.deleteFile(value.filId, value.filSn, formid) }}).appendTo('#del' + formid + key);
					// " + value.filId + "," + value.filSn + ",\'" + formid + "\'
	       		});
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
					alert('파일 조회중 오류가 발생했습니다.');
				}
				Fn.Loading.end();
	        }
	    });
	},
	selectFileList3 : function(formid, filId)
	{
		$('#fileInfo' + formid).html('');
		$.ajax({
	        url : '/file/selectFileList.do?filId=' + filId,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
				$.each(data.fileList, function(key, value)
				{
					$('#fileInfo' + formid).append(
					  "<li>"
					+ "	<ul>"
					+ "		<li id='secd" + formid + key + "' class='col1'>" + value.filSecCd + "</li>"
					+ "		<li id='name" + formid + key + "' class='col2'></li>"
					+ "		<li id='size" + formid + key + "' class='col3'>" + value.filMgVal + "</li>"
					+ "		<li id='desc" + formid + key + "' class='col4'>" + value.filCn	 + "</li>"
					+ "		<li id='rgtr" + formid + key + "' class='col5'>" + value.rgstrId	 + "</li>"
					+ "		<li id='rgdt" + formid + key + "' class='col6'>" + value.rgstDt	 + "</li>"
					+ "		<li id='delt" + formid + key + "' class='col7'></li>"
					+ "</ul>"
					+ "</li>"
					);

					$("<a>", {text:value.orgFilNm, click:function() {Fn.File.downloadFile(value.filId, value.filSn)}}).appendTo('#name' + formid + key);
					$("<a>", {text:'삭제', 'class':'g_btn_del', click:function() {Fn.File.deleteFile1(value.filId, value.filSn, formid) }}).appendTo('#delt' + formid + key);

	       		});

				if($('#' + formid + 'secd').css('display') == 'none') $("li[id^='secd" + formid + "']").css('display', 'none');
				else $("li[id^='secd" + formid + "']").css('display', 'table-cell');

				if($('#' + formid + 'name').css('display') == 'none') $("li[id^='name" + formid + "']").css('display', 'none');
				else $("li[id^='name" + formid + "']").css('display', 'table-cell');

				if($('#' + formid + 'size').css('display') == 'none') $("li[id^='size" + formid + "']").css('display', 'none');
				else $("li[id^='size" + formid + "']").css('display', 'table-cell');

				if($('#' + formid + 'desc').css('display') == 'none') $("li[id^='desc" + formid + "']").css('display', 'none');
				else $("li[id^='desc" + formid + "']").css('display', 'table-cell');

				if($('#' + formid + 'rgtr').css('display') == 'none') $("li[id^='rgtr" + formid + "']").css('display', 'none');
				else $("li[id^='rgtr" + formid + "']").css('display', 'table-cell');

				if($('#' + formid + 'rgdt').css('display') == 'none') $("li[id^='rgdt" + formid + "']").css('display', 'none');
				else $("li[id^='rgdt" + formid + "']").css('display', 'table-cell');

				if($('#' + formid + 'delt').css('display') == 'none') $("li[id^='delt" + formid + "']").css('display', 'none');
				else $("li[id^='delt" + formid + "']").css('display', 'table-cell');
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
					alert('파일 조회중 오류가 발생했습니다.');
				}
				Fn.Loading.end();
	        }
	    });
	},
	selectFile : function(formid, filId, filSn)
	{
		var oldtr = $("#" + formid + " tr:eq('" + filSn + "')");
		var newtr = oldtr.clone();

		$.ajax({
	        url : '/file/selectFile.do?filId=' + filId + '&filSn=' + filSn,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
	    		newtr.find('.rgstDt').text(data.file != null ? data.file.rgstDt : '');
	    		newtr.find('.orgFilNm').text(data.file != null ? data.file.orgFilNm : '');
	    		newtr.find('.mgr').empty();
	    		if(data.file != null)
	    		{
	    			newtr.find('.mgr').append($("<button/>", {'text':'보기', 'class':'g_btn_doc', click:function(e){location.href='/file/fileDownload.do?filId=' + filId + '&filSn=' + filSn;}}));
	    			newtr.find('.mgr').append($("<button/>", {'text':'삭제', 'class':'g_btn_del', click:function(e)
	    				{
							$.ajax(
							{
								url : '/file/deleteFile.do?filId=' + filId + '&filSn=' + filSn,
							    type : 'post',
							    async : false,
							    data : '',
							    success: function(data, textStatus, xhr)
							    {
							    	Fn.File.selectFile(formid, filId, filSn);
							    },
							    error: function(xhr, textStatus, errorThrown)
							    {
									var response = null;
									try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
						        	if(response.errorStack){
						        		fnException(response);
						        	}else{
										alert('파일 삭제중 오류가 발생했습니다.');
									}
									Fn.Loading.end();
							    }
							});

	    				}}));
	    		}
	    		oldtr.replaceWith(newtr);
			}
		});
	},
	selectFile1 : function(formid, filId, filSn)
	{
		$.ajax({
	        url : '/file/selectFile.do?filId=' + filId + '&filSn=' + filSn,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
	        	$('#filCn' + formid).val(data.file.orgFilNm);
	        	///file/fileDownload.do?filId='" + data.file.filId + "filSn=" + data.file.filSn
			},
			error: function(xhr){
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
	        	if(response.errorStack){
	        		fnException(response);
	        	}else{
	        		alert('파일목록 조회중 오류가 발생했습니다.');
	        	}
	        	Fn.Loading.end();
			}
		});
	},
	deleteFile : function(filId, filSn, formid)
	{
		$.ajax({
	        url : '/file/deleteFile.do?filId=' + filId + '&filSn=' + filSn,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
	        	//$('#fileInfo' + formid).load('/file/selectFileList.do?filId=' + filId);
	        	Fn.File.selectFileList(formid, filId);
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
				if(response.errorStack){
					fnException(response);
				}else{
					alert('파일 삭제중 오류가 발생했습니다.');
				}
				Fn.Loading.end();
	        }
	    });
	},
	deleteFile1 : function(filId, filSn, formid)
	{
		$.ajax({
	        url : '/file/deleteFile.do?filId=' + filId + '&filSn=' + filSn,
	        type : 'post',
	        async : true,
	        data : '',
	        success: function(data, textStatus, xhr)
			{
	        	Fn.File.selectFileList3(formid, filId);
	        },
	        error: function(xhr, textStatus, errorThrown)
	        {
				var response = null;
				try{ response = JSON.parse(xhr.responseText) } catch(e){ response = {} };
				if(response.errorStack){
					fnException(response);
				}else{
					alert('파일 삭제중 오류가 발생했습니다.');
				}
				Fn.Loading.end();
	        }
	    });
	}
}

Fn.Session = {
	getCAuth : function()
	{
		try { return eqFilter(top.allMenu, {'menuId':top.thisPage})[0].crtRolAt } catch(e) { return ''; };
	},

	getUAuth : function()
	{
		try { return eqFilter(top.allMenu, {'menuId':top.thisPage})[0].updtRolAt } catch(e) { return ''; };
	},

	getDAuth : function()
	{
		try { return eqFilter(top.allMenu, {'menuId':top.thisPage})[0].delRolAt } catch(e) { return ''; };
	},
	sessionTimeout : ssTimeout,
	displaySessionTimeout : function()
    {
        //assigning minutes left to session timeout to Label
        document.getElementById("spaTimeout").innerText = Fn.Session.sessionTimeout;
        Fn.Session.sessionTimeout = Fn.Session.sessionTimeout - 1;

        //if session is not less than 0
        if (Fn.Session.sessionTimeout >= 0)
        {
            //call the function again after 1 minute delay
            top.timeoutHandler = window.setTimeout("Fn.Session.displaySessionTimeout()", 60000);
        }
        else
        {
            //show message box
            //alert("Your current Session is over.");
            alert(ssTimeout + "분이상 자리비움시 강제 로그아웃됩니다.");
            location.href='/security/logout';
        }
    }
}

Fn.Egov = {};
Fn.Egov.LawInfo = {
	lawSearch : function(lawName)
	{
		window.open('/DRF/lawSearch.do?target=eflaw&type=html&query=' + lawName);
	},
	lawMakingSearch : function(lawMakingName)
	{
		window.open('/rest/govLmSts.html?query=' + lawMakingName);
	}
}

Fn.Event = {};
Fn.Event.Key = {
	onlyAlphabet : function(e){
		var regExp = /[^a-z]/gi;
		e.target.value = e.target.value.replace(regExp, "");
	},
	onlyNumber : function(e){
		var regExp = /[^0-9]/gi;
		e.target.value = e.target.value.replace(regExp, "");
	},
	onlyAlphabetNumber : function(e){
		var regExp = /[^a-z0-9]/gi;
		e.target.value = e.target.value.replace(regExp, "");
	},
	setComma : function(e){
		var regExp = /[^0-9]/gi;
		var number = e.target.value.replace(regExp, "");
		number = Fn.Number.setComma(number);
		e.target.value = number;
	},
	setDate : function(e){
		e.target.maxLength = 10;
		var regExp = /[^0-9]/gi;
		var number = e.target.value.replace(regExp, "");
		e.target.value = Fn.String.formatDate(number);
	},
	setTime : function(e){
		e.target.maxLength = 5;
		var regExp = /[^0-9]/gi;
		var number = e.target.value.replace(regExp, "");
		e.target.value = Fn.String.formatTime(number);
	},
	setDatetime : function(e){
		e.target.maxLength = 19;
		var regExp = /[^0-9]/gi;
		var number = e.target.value.replace(regExp, "");
		e.target.value = Fn.String.formatDatetime(number);
	}
};

Fn.Datepicker = {
	/* 내부적으로만 사용 */
	setDefaults : function(){
		$.datepicker.setDefaults({
			dateFormat : 'yy-mm-dd', //Input Display Format 변경
			showOterMonths : true, //빈 공간에 현재월의 앞뒤월 날짜를 표시
			showMonthAfterYear : true, //년도 먼저 나오고, 뒤에 월 표시
			changeYear : true, //콤보박스에서 년 선택 가능
			changeMonth : true, //콤보박스에서 월 선택 가능
			//showOn : "both", //button:버튼을 표시하고, 버튼을 눌러야만 달력 표시 ^ both:버튼을 표시하고, 버튼을 누르거나 input을 클릭하면 달력 표시
			//buttonImage : "/css/jquery/images/calendar.gif", //버튼 이미지 경로
			buttonImageOnly : true, //기본 버튼의 회색 부분을 없애고, 이미지만 보이게 함
			//buttonText : "선택", //버튼에 마우스 갖다 댔을 때 표시되는 텍스트
			//yearSuffix : "년", //달력의 년도 부분 뒤에 붙는 텍스트
			monthNamesShort : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], //달력의 월 부분 텍스트
			monthNames : ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], //달력의 월 부분 Tooltip 텍스트
			dayNamesMin : ["일", "월", "화", "수", "목", "금", "토"], //달력의 요일 부분 텍스트
			dayNames : ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"], //달력의 요일 부분 Tooltip 텍스트
			showButtonPanel: true,
			currentText: "오늘",
			closeText: "닫기",
			//minDate : "-1M", //최소 선택일자(-1D:하루전, -1M:한달전,  -1Y:일년전)
			//maxDate : "+1M", //최대 선택일자(+1D:하루후, +1M:한달후,  +1Y:일년후)
		});
	},
	/*
	datepicker 초기 값 설정
	- optn.setDate : 날짜 세팅 (특정일자:yyyy-mm-dd), (today:오늘), (-1D:하루전, -1M:한달전,  -1Y:일년전), (+1D:하루후, +1M:한달후,  +1Y:일년후)
					datepicker 에서의 설정 : $("#toDate").datepicker("setDate", "today");
	- optn.option.[minDate | maxDate | ...] : datepicker 의 기타 옵션 설정..
					datepicker 에서의 설정 : $("#toDate").datepicker("option", "minDate", "-3M");
	*/
	setOption : function(optn){
		optn = optn || {};
		optn.setDate = optn.setDate || "today"; //(today:오늘), (-1D:하루전, -1M:한달전,  -1Y:일년전), (+1D:하루후, +1M:한달후,  +1Y:일년후)
		optn.option = optn.option || {};
		optn.dateFormat = optn.dateFormat || 'yy-mm-dd';
		//
		var ele = Fn.Element.get(optn);
		$(ele).datepicker({dateFormat:optn.dateFormat});
		$(ele).datepicker("setDate", optn.setDate);

		for(var key in optn.option){
			$(ele).datepicker("option", key, optn.option[key]);
		}
	},
	/*
	datepicker 최대 조회 기간 설정
	- optn.fromId : 시작일자 input id
	- optn.toId : 종료일자 input id
	- optn.term : 최대 조회 기간 (default : 30)
	*/
	setFromTo : function(optn){
		optn = optn || {};
		optn.term = optn.term || 30;

		var fromElement = Fn.Element.get({id : optn.fromId, context: optn.context});
		var toElement = Fn.Element.get({id : optn.toId, context: optn.context});

		$(fromElement).datepicker("option", "onSelect", function(dateText, inst){
			changeFrom();
		});

		$(toElement).datepicker("option", "onSelect", function(dateText, inst){
			changeTo();
		});

		fromElement.addEventListener("change", changeFrom);
		toElement.addEventListener("change", changeTo);

		function changeFrom(){
			var fromDate = Fn.Datepicker.getDate({id : optn.fromId, context: optn.context});
			var toDate = Fn.Datepicker.getDate({id : optn.toId, context: optn.context});
			var term = Fn.Date.calcDate(fromDate, toDate);
			//console.log("fromDate : " + Fn.Date.toString(fromDate) + " , toDate : " + Fn.Date.toString(toDate));
			//console.log("term : " + term + " , optn.term : " + optn.term);
			if(term < 0 || term > optn.term){
				//alert("최대 조회 기간은 " + optn.term + "일을 초과 할 수 없습니다.");
				$(toElement).datepicker("setDate", Fn.Date.toString(Fn.Date.addDate(fromDate, optn.term)));
			}
		}
		function changeTo(){
			var fromDate = Fn.Datepicker.getDate({id : optn.fromId, context: optn.context});
			var toDate = Fn.Datepicker.getDate({id : optn.toId, context: optn.context});
			var term = Fn.Date.calcDate(fromDate, toDate);
			//console.log("fromDate : " + Fn.Date.toString(fromDate) + " , toDate : " + Fn.Date.toString(toDate));
			//console.log(term + " : " + optn.term);
			if(term < 0 || term > optn.term){
				//alert("최대 조회 기간은 " + optn.term + "일을 초과 할 수 없습니다.");
				$(fromElement).datepicker("setDate", Fn.Date.toString(Fn.Date.addDate(toDate, "-"+optn.term)));
			}
		}
	},
	getDate : function(optn){
		var ele = Fn.Element.get(optn);
		return $(ele).datepicker("getDate");
	}
}

Fn.Style = {
	get : function(href, selectorText){
		for(var i = 0 ; i < document.styleSheets.length ; i++){
			//if(document.styleSheets[i].href.endsWith(href)){
			if(document.styleSheets[i].href.indexOf(href)){
				var rules = document.styleSheets[i].rules;
				for(var j = 0 ; j < rules.length ; j++){
					if(rules[j].selectorText == selectorText){
						return rules[j].style.cssText;
					}
				}
			}
		}
	},
	set : function(selectorText, cssText){
		document.styleSheets[document.styleSheets.length-1].addRule(selectorText, cssText);
	}
}

Fn.UI = {};
Fn.UI.SelectBox = {
	/*
	셀렉트 박스로 추가/제외 처리가 필요할때..
	sIn : 추가 대상이 들어갈 selectbox
	sOut : 제외 대상이 들어갈 selectbox
	btnIn : 추가 이벤트 버튼
	btnOut : 제외 이벤트 버튼
	*/
	setInOut : function(sIn, sOut, btnIn, btnOut){
		function deduplication(){
			var inOptions = sIn.getElementsByTagName("option");
			var outOptions = sOut.getElementsByTagName("option");

			for(var i = 0 ; i < inOptions.length ; i++){
				for(var j = 0 ; j < outOptions.length ; j++){
					if(inOptions[i].outerHTML == outOptions[j].outerHTML){
						sOut.removeChild(outOptions[j]);
					}
				}
			}
		}
		sIn.ondblclick = function(e){
			e.target.selected = false;
			sOut.appendChild(e.target);
		}
		sOut.ondblclick = function(e){
			e.target.selected = false;
			sIn.appendChild(e.target);
		}
		if(btnIn){
			btnIn.onclick = function(e){
				var options = sOut.getElementsByTagName("option");
				for(var i = 0 ; i < options.length ; i++){
					if(options[i].selected){
						options[i].selected = false;
						sIn.appendChild(options[i]);
						i--;
					}
				}
			}
		}
		if(btnOut){
			btnOut.onclick = function(e){
				var options = sIn.getElementsByTagName("option");
				for(var i = 0 ; i < options.length ; i++){
					if(options[i].selected){
						options[i].selected = false;
						sOut.appendChild(options[i]);
						i--;
					}
				}
			}
		}
		deduplication();
	}
}

Fn.UI.Table = {
	rowSelect : function(optn){
		var table = Fn.Element.get(optn);
		$(table).click(function(e){
			var tr = $(e.target).parents("tr")[0];
			$(tr).parents("table").find("tr").each(function(idx, ele){
				if(tr == ele){
					$(this).addClass("rowSelected");
					this.style.backgroundColor = "#ccccff";
				}else{
					$(this).removeClass("rowSelected");
					this.style.backgroundColor = "#ffffff";
				}
			});
		});
		$(table).dblclick(function(e){
			var tr = $(e.target).parents("tr")[0];
			optn.dblclick(tr);
		});
	},
	dynamic : function(optn){
		optn = optn || {};
		optn.mode = optn.mode || "";
		optn.btnAddRowId = optn.btnAddRowId || "btnAddRow";
		optn.btnRemoveRowId = optn.btnRemoveRowId || "btnRemoveRow";

		var table = Fn.Element.get(optn);

		var removeRow;

		if(optn.mode == "checkbox"){
			removeRow = function(e){
				for(var i = 0 ; i < table.rows.length ; i++){
					if(table.rows[i].cells[0].childNodes[0].checked){
						table.deleteRow(i);
						i--;
					}
				}
			}
		}else{
			document.head.appendChild(document.createElement("style"));
			document.styleSheets[document.styleSheets.length-1].addRule("tr.rowSelected", "background-color:#ffdddd;");
			//document.styleSheets[document.styleSheets.length-1].insertRule("tr.select{background-color:#ffdddd;}");

			$(table).click(function(e){
				var tr = $(e.target).parents("tr")[0];
				var rowIndex = tr.rowIndex;
				$(this).find("tr").each(function(idx, ele){
					if(rowIndex == ele.rowIndex){
						$(ele).addClass("rowSelected");
					}else{
						$(ele).removeClass("rowSelected");
					}
				});
			});

			removeRow = function(e){
				for(var i = 0 ; i < table.rows.length ; i++){
					console.log(table.rows[i].style.backgroundColor);
					if(table.rows[i].className.indexOf("rowSelected") > -1){
						table.deleteRow(i);
					}
				}
			}
		}

		var btnAddRow = document.getElementById(optn.context ? optn.context.real(optn.btnAddRowId) : optn.btnAddRowId);
		var btnRemoveRow = document.getElementById(optn.context ? optn.context.real(optn.btnRemoveRowId) : optn.btnRemoveRowId);

		btnAddRow.onclick = function(e){
			//reset datepicker
			if(optn.html){
				$(table).find("tbody").append($(optn.html).clone(true));
			}else{
				$(table).find("thead tr .calend").datepicker("destroy");
				$(table).find("thead tr .calend").removeAttr("id");
				$(table).find("tbody").append($(table).find("thead tr").clone(true));
				$(table).find("tbody .calend").datepicker();
			}
		}

		btnRemoveRow.onclick = removeRow;
	},
	setInOut : function(tbIn, tbOut, btnIn, btnOut, startRowIndex, optn){
		optn = optn || {};
		var Fn = {};
		Fn.deduplication = function(){
			var inDatas = Fn.Table.getDatas(tbIn);
			var outDatas = Fn.Table.getDatas(tbOut);

			var indexArr = [];
			for(var i = 0 ; i < inDatas.length ; i++){
				for(var j = 0 ; j < outDatas.length ; j++){
					if(inDatas[i].toString() == outDatas[j].toString()){
						indexArr.push(j);
					}
				}
			}

			indexArr.sort(function(a, b){ return a < b ? 1 : -1;});
			for(var i = 0 ; i < indexArr.length ; i++){
				tbOut.deleteRow(startRowIndex+indexArr[i]);
			}
			Fn.Table.setRowClick(tbIn);
			Fn.Table.setRowClick(tbOut);
			Fn.Table.setRowDblClick(tbIn);
			Fn.Table.setRowDblClick(tbOut);
			if(optn.callback){
				optn.callback();
			}
		}

		Fn.Table = {
			getDatas : function(tb){
				var datas = [];
				for(var i = startRowIndex ; i < tb.rows.length ; i++){
					datas.push(Fn.Table.getRowData(tb, i));
				}
				return datas;
			},
			getRowData : function(tb, rowIndex){
				var row = tb.rows[rowIndex];
				var data = [];
				for(var i = 1 ; i < row.cells.length ; i++){
					data.push(row.cells[i].innerText);
				}
				return data;
			},
			getCheckedDatas : function(tb){
				var datas = [];
				for(var i = startRowIndex ; i < tb.rows.length ; i++){
					var row = tb.rows[i];
					var checkbox = row.querySelector("input[type=checkbox]");
					if(checkbox.checked){
						datas.push(Fn.Table.getRowData(tb, i));
					}
				}
				return datas;
			},
			getCheckedRows : function(tb){
				var rows = [];
				for(var i = startRowIndex ; i < tb.rows.length ; i++){
					var row = tb.rows[i];
					var checkbox = row.querySelector("input[type=checkbox]");
					if(checkbox.checked){
						checkbox.checked = false;
						rows.push(row);
					}
				}
				return rows;
			},
			deleteCheckedRow : function(tb){
				for(var i = tb.rows.length-1 ; i >= startRowIndex ; i--){
					var row = tb.rows[i];
					var checkbox = row.querySelector("input[type=checkbox]");
					if(checkbox.checked){
						tb.deleteRow(i);
					}
				}
			},
			setRowClick : function(tb){
				for(var i = startRowIndex ; i < tb.rows.length ; i++){
					tb.rows[i].onclick = function(e){
						if(e.target.tagName.toLowerCase() == "td"){
							var row = e.target.parentElement;
							var checkbox = row.querySelector("input[type=checkbox]");
							if(checkbox.checked){
								checkbox.checked = false;
							}else{
								checkbox.checked = true;
							}
						}
					}
				}
			},
			setRowDblClick : function(tb){
				for(var i = startRowIndex ; i < tb.rows.length ; i++){
					tb.rows[i].ondblclick = function(e){
						if(e.target.tagName.toLowerCase() == "td"){
							var row = e.target.parentElement;

							var checkbox = row.querySelector("input[type=checkbox]");
							checkbox.checked = false;

							var table = e.target.parentElement.parentElement.parentElement;
							if(table == tbIn){
								tbOut.tBodies[0].appendChild(row);
							}else{
								tbIn.tBodies[0].appendChild(row);
							}

						}
					}
				}
			},
			clear : function(tb){
				while(tb.rows.length > startRowIndex){
					tb.deleteRow(startRowIndex);
				}
			}
		};

		btnIn.onclick = function(e){
			var checkedRows = Fn.Table.getCheckedRows(tbOut);
			for(var i = 0 ; i < checkedRows.length ; i++){
				tbIn.tBodies[0].appendChild(checkedRows[i]);
				if(optn.inCallback){
					optn.inCallback(checkedRows[i]);
				}
			}
		}

		btnOut.onclick = function(e){
			var checkedRows = Fn.Table.getCheckedRows(tbIn);
			for(var i = 0 ; i < checkedRows.length ; i++){
				tbOut.tBodies[0].appendChild(checkedRows[i]);
				if(optn.outCallback){
					optn.outCallback(checkedRows[i]);
				}
			}
		}

		return Fn;
	},
	setUpDown : function(optn){
		optn = optn || {};
		optn.isHead = optn.isHead == undefined ? true : optn.isHead;

		var table = Fn.Element.get(optn);

		if(optn.isHead && !table.getAttribute("isHead")){
			//set colgroup
			var colgroup = table.getElementsByTagName("colgroup")[0];
			var col;
			col = document.createElement("col");
			col.style.width = "50px";
			$(colgroup).prepend(col);

			//set thead
			var row, cell;
			var thead = table.tHead;
			row = thead.rows[0];
			cell = document.createElement("th");
			cell.innerText = "순번";
			$(row).prepend(cell);

			table.setAttribute("isHead", true);
		}

		//set tbody
		var tbody = table.tBodies[0];
		for(var i = 0 ; i < tbody.rows.length ; i++){
			row = tbody.rows[i];
			cell = document.createElement("td");
			var hidden = document.createElement("input");
			hidden.type = "hidden";
			hidden.id = "oldNo";
			hidden.value = i+1;
			cell.appendChild(hidden);
			var p = document.createElement("p");
			$(p).append(i+1);
			cell.appendChild(p);
			$(row).prepend(cell);
		}

		$(table).click(function(e){
			var tr = $(e.target).parents("tr")[0];
			$(tr).parents("table").find("tr").each(function(idx, ele){
				if(tr == ele){
					$(this).addClass("rowSelected");
					this.style.backgroundColor = "#ccccff";
				}else{
					$(this).removeClass("rowSelected");
					this.style.backgroundColor = "#ffffff";
		}
			});
		});

		$(optn.btnUp).click(function(e){
			var tr = $(table).find(".rowSelected")[0];
				tr.previousElementSibling.insertAdjacentElement("beforebegin", tr);
				setNumber();
		});

		$(optn.btnDown).click(function(e){
			var tr = $(table).find(".rowSelected")[0];
				tr.nextElementSibling.insertAdjacentElement("afterend", tr);
				setNumber();
		});

		function setNumber(){
			for(var i = 0 ; i < tbody.rows.length ; i++){
				tbody.rows[i].cells[0].getElementsByTagName("p")[0].innerText = i+1;
			}
		}
	}
}

Fn.Loading = {
	start : function()
	{
		if(top.document.getElementById('divLoading') != undefined)
		{
			top.document.getElementById('divLoading').style.display = 'block';
		}
		/*var loadingBar = $("<div class='loading'><p>데이터 처리중입니다.</p></div>");
		$(document.body).append(loadingBar);
		//test용
		var btnClose = $("<input>", {type:"button", value:"Close Loading"});
		$(btnClose).click(function(){Fn.Loading.end();});
		$(loadingBar).find("p").append(btnClose);*/
	},
	end : function(){
		if(top.document.getElementById('divLoading') != undefined)
		{
			top.document.getElementById('divLoading').style.display = 'none';
		}
		/*$(".loading").remove();*/
	}
}

Fn.Page = {
	set : function(optn){
		console.warn('사용되지 않는 함수입니다. 제거될 예정이니 소스를 수정해 주세요.')
	},
	test : function(optn)
	{
		console.warn('사용되지 않는 함수입니다. 제거될 예정이니 소스를 수정해 주세요.')
	}
}
//
/**************************************
Hwp
꼭 읽어 보세요!!!!
파일 <<View 옵션>>들을 스크립트에서 수정 할 수 있도록 설정이 되어있습니다.
스크립트에서 <<데이터 이외의 속성>>들을 수정하실수 있는데요.
왠만하면 <<기본 값으로 사용>>해주시고 꼭 <<필요한 사항들만 옵션을 변경>>하여 사용해주세요.
그리고 <<데이터 부분은 자바 참조>>하여 주시기 바랍니다.
기존에 개발 도중에 만든건이라 스트립트로 데이터를 넣는 부분은 사용을 자제해주세요.
ex)
//설정 옵션은 특정한 경우가 아니면 기본 옵션으로 사용하세요.
Fn.Hwp.open({
	url : {
		create : "/sample/createHwp.do", //구현 필요
		save : "/sol/docu-word/sample/saveTest.jsp", //구현 필요
	},
	files : [
		{
			template : "/form/test01.hwp",
			path : "/form/test01.hwp",
			titleBar : {nm : "편집창01"},
		},
		{
			template : "/form/test02.hwp",
			path : "/form/test02.hwp",
			titleBar : {nm : "편집창02"},
		},
	]
});
***************************************
*/
Fn.Hwp = {
	open : function(optn){
		alert("Fn.Hwp.open 을 VC.openHwp 으로 변경하여 처리해주십시오.");
	}
}

eqFilter = function(my_object, my_criteria)
{
	if(my_object == undefined) return {};

	var tmpData = JSON.parse(JSON.stringify(my_object));
	return tmpData.filter(function(obj)
	{
		return Object.keys(my_criteria).every(function(c)
		{
			return obj[c] == my_criteria[c];
		});
	});
};

neFilter = function(my_object, my_criteria)
{
	if(my_object == undefined) return {};

	var tmpData = JSON.parse(JSON.stringify(my_object));
	return tmpData.filter(function(obj)
	{
		return Object.keys(my_criteria).every(function(c)
		{
			return obj[c] != my_criteria[c];
		});
	});
};

loadScript = function loadScript(url, callback)
{
    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
};

/* Element 정보 보기 (alt키 + 좌클릭) */
document.addEventListener("click", function(e){
	if(e.altKey){
		//e.stopPropagation();
		e.preventDefault();

		var info = {};
		if(e.target.tagName.toLowerCase() == "canvas"){
			var grid = RealGridJS.getActiveGrid();
			info = grid.getDataProvider().getJsonRow(grid.getCurrent().dataRow);
		}else{
			info = {
				"tagName" : e.target.tagName.toLowerCase(),
				"id" : e.target.id,
				"name" : e.target.id,
				"data-column" : e.target.getAttribute("data-column"),
				"value" : e.target.value,
			}
			if(e.target.options){
				var codes = [];
				for(var i = 0 ; i < e.target.options.length ; i++){
					codes.push({label : e.target.options[i].text, value : e.target.options[i].value});
				}
				info.codes = codes;
			}
		}
		console.log(info);
	}
}, false);

$(function(){
	//테스트용... alt + 1 => 오늘 날짜 + 시분
	document.addEventListener("keydown",function(e){
		if(e.altKey){
			if(e.key == 1){
				var today = new Date();
				var month = today.getMonth()+1;
				if(e.target.type.toLowerCase() == "text"){
					e.target.value = today.getFullYear() + "-" + (month < 10 ? "0"+month : month) + "-" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes();
				}
			}
		}
	});

	var elements;

	//form 에 input text 가 하나일때 Enter 치면 submit 처리 되는 것 방지...
	elements = document.getElementsByTagName("input");

	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keydown", function(e){
			var regExp = new RegExp(/Enter/);
			if(regExp.test(e.key)){
				e.preventDefault();
			}
		});
	}

	//input text 의 className 으로 처리

	//only Alphabet
	elements = document.getElementsByClassName("onlyAlphabet");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.onlyAlphabet);
		elements[i].addEventListener("blur", Fn.Event.Key.onlyAlphabet);
	}

	//only Number
	elements = document.getElementsByClassName("onlyNumber");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.onlyNumber);
		elements[i].addEventListener("blur", Fn.Event.Key.onlyNumber);
	}

	//only Alphabet Number
	elements = document.getElementsByClassName("onlyAlphabetNumber");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.onlyAlphabetNumber);
		elements[i].addEventListener("blur", Fn.Event.Key.onlyAlphabetNumber);
	}

	//set comma
	elements = document.getElementsByClassName("comma");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.setComma);
		elements[i].addEventListener("blur", Fn.Event.Key.setComma);
	}

	//set date
	elements = document.getElementsByClassName("date");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.setDate);
		elements[i].addEventListener("blur", Fn.Event.Key.setDate);
	}

	//set time
	elements = document.getElementsByClassName("time");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.setTime);
		elements[i].addEventListener("blur", Fn.Event.Key.setTime);
	}

	//set datetime
	elements = document.getElementsByClassName("datetime");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.setDatetime);
		elements[i].addEventListener("blur", Fn.Event.Key.setDatetime);
	}

	//set datepicker
	elements = document.getElementsByClassName("calend");
	for(var i = 0 ; i < elements.length ; i++){
		elements[i].addEventListener("keyup", Fn.Event.Key.setDate);
		elements[i].addEventListener("blur", Fn.Event.Key.setDate);
	}

	if($.datepicker){
		Fn.Datepicker.setDefaults();
		$(".calend").datepicker();
	}

});


Fn.Input = {
	setting : function(){
		document.addEventListener("keydown",function(e){
			if(e.altKey){
				if(e.key == 1){
					var today = new Date();
					var month = today.getMonth()+1;
					if(e.target.type.toLowerCase() == "text"){
						e.target.value = today.getFullYear() + "-" + (month < 10 ? "0"+month : month) + "-" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes();
					}
				}
			}
		});

		var elements;

		//form 에 input text 가 하나일때 Enter 치면 submit 처리 되는 것 방지...
		elements = document.getElementsByTagName("input");

		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keydown", function(e){
				var regExp = new RegExp(/Enter/);
				if(regExp.test(e.key)){
					e.preventDefault();
				}
			});
		}

		//input text 의 className 으로 처리

		//only Alphabet
		elements = document.getElementsByClassName("onlyAlphabet");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.onlyAlphabet);
			elements[i].addEventListener("blur", Fn.Event.Key.onlyAlphabet);
		}

		//only Number
		elements = document.getElementsByClassName("onlyNumber");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.onlyNumber);
			elements[i].addEventListener("blur", Fn.Event.Key.onlyNumber);
		}

		//only Alphabet Number
		elements = document.getElementsByClassName("onlyAlphabetNumber");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.onlyAlphabetNumber);
			elements[i].addEventListener("blur", Fn.Event.Key.onlyAlphabetNumber);
		}

		//set comma
		elements = document.getElementsByClassName("comma");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.setComma);
			elements[i].addEventListener("blur", Fn.Event.Key.setComma);
		}

		//set date
		elements = document.getElementsByClassName("date");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.setDate);
			elements[i].addEventListener("blur", Fn.Event.Key.setDate);
		}

		//set time
		elements = document.getElementsByClassName("time");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.setTime);
			elements[i].addEventListener("blur", Fn.Event.Key.setTime);
		}

		//set datetime
		elements = document.getElementsByClassName("datetime");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.setDatetime);
			elements[i].addEventListener("blur", Fn.Event.Key.setDatetime);
		}

		//set datepicker
		elements = document.getElementsByClassName("calend");
		for(var i = 0 ; i < elements.length ; i++){
			elements[i].addEventListener("keyup", Fn.Event.Key.setDate);
			elements[i].addEventListener("blur", Fn.Event.Key.setDate);
		}

		if($.datepicker){
			Fn.Datepicker.setDefaults();
			$(".calend").datepicker();
		}
	}
}


/*
 * @name checkDate : 날짜 형식 확인
 * @param {String} yy
 * @param {String} mm
 * @param {String} dd
 * @return {boolean}
 **/
function isDate(mm,dd,yy){
	dateFormat = new Date(yy,mm,dd);

	if( mm == 12 ) {
		strYear = dateFormat.getFullYear() - 1;
	} else {
		strYear = dateFormat.getFullYear();
	}

	if( dateFormat.getMonth() == 0 ) {
		strMonth = 12;
	} else {
		strMonth = dateFormat.getMonth();
	}
	strDay = dateFormat.getDate();

	if (yy == strYear && mm == strMonth && dd == strDay) {
		return true;
	} else {
		return false;
	}
}

/*
 * @name isSSN : 주민등록번호 형식 확인
 * @param {String} ssn1
 * @param {String} ssn2
 * @return {boolean}
 **/
function isSSN(ssn1,ssn2) {
	if (ssn1.length != 6 || ssn2.length != 7) {
		return false;
	}

	if (!ereg("^[0-9]{2}[0|1]{1}[0-9]{1}[0-3]{1}[0-9]{1}[1|2|3|4]{1}[0-9]{6}$", ssn1+ssn2)) {
		return false;
	}

	ssn = ssn1 + "" + ssn2
	juminyear = ( '2' >= ssn.substr(6,1)) ? "19" : "20";

	if (!checkDate(ssn.substr(2,2),ssn.substr(4,2),juminyear+""+ssn.substr(0,2))) {
		return false;
	}

	tmpjumin = 0;

	for(i=0;i<12;i++){
		if(i>7) jumincheck=i-6;
		else jumincheck=i+2;
		jumincut = ssn.substr(i,1);
		tmpjumin = tmpjumin + jumincut * jumincheck;
	}
	jumintype = 11 - tmpjumin % 11;

	if(jumintype > 9){
		jumintype = jumintype - 10;
	}

	if(jumintype != ssn.substr(ssn.length-1,1)) {
		return false;
	}

	return true;
}

/*
 * @name isFNN : 외국인등록번호 형식 확인
 * @param {String} fnn
 * @return {boolean}
 **/
function isFNN(fnn) {
	var sum = 0;
	var odd = 0;
	buf = new Array(13);

	for(i=0; i<13; i++) {
		buf[i] = parseInt(fgnno.charAt(i));
	}

	odd = buf[7]*10 + buf[8];

	if(odd%2 != 0) {
		return false;
	}

	if((buf[11]!=6) && (buf[11]!=7) && (buf[11]!=8) && (buf[11]!=9)) {
		return false;
	}

	multipliers = [2,3,4,5,6,7,8,9,2,3,4,5];

	for(i=0, sum=0; i<12; i++) {
		sum += (buf[i] *= multipliers[i]);
	}

	sum = 11 - (sum%11);

	if(sum >= 10) {
		sum -= 10;
	}

	sum += 2;
	if(sum >= 10) {
		sum -= 10;
	}

	if(sum != buf[12]){
		return false;
	}

	return true;
}

/*
 * @name IsBizCode : 사업자 등록번호 체크
 * @param {String} bizcode : 사업자번호
 * @return {boolean}
 **/
function isBizCode(bizcode) {
	if(bizcode == null || bizcode.match(/\d{3}\-\d{2}\-\d{5}/) == null) return false;

	bizcode = bizcode.replace(/\-/g,'');
  if(bizcode.length != 10) return false;

  var sum = 0;
  sum += parseInt(bizcode.substring(0,1));
  sum += parseInt(bizcode.substring(1,2)) * 3 % 10;
  sum += parseInt(bizcode.substring(2,3)) * 7 % 10;
  sum += parseInt(bizcode.substring(3,4)) * 1 % 10;
  sum += parseInt(bizcode.substring(4,5)) * 3 % 10;
  sum += parseInt(bizcode.substring(5,6)) * 7 % 10;
  sum += parseInt(bizcode.substring(6,7)) * 1 % 10;
  sum += parseInt(bizcode.substring(7,8)) * 3 % 10;
  sum += Math.floor(parseInt(bizcode.substring(8,9)) * 5 / 10);
  sum += parseInt(bizcode.substring(8,9)) * 5 % 10;
  sum += parseInt(bizcode.substring(9,10));

  if (sum % 10 == 0) return true;
 	else
	  return false;
}

/*
 * @name isMail : 이메일 형식 체크
 * @param {String} fnn
 * @return {boolean}
 **/
function isMail(id,addr,context) {
	//
	var regExp = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/;
	if(regExp.test(addr) == false){
		alert("이메일 형식이 올바르지 않습니다.");
		context.$("#"+id).focus();
		return false;
	}
}

/* 비밀번호 형식 체크(정규식)
 * 길이 : 9자 이상
 * 영문 대소문자 1자 이상 포함
 * 동일문자 3자리 이상 금지
 * 연속문자 3자리 이상 금지
 * */
//function PasswordCheck(pw) {
//	if(pw == null) return false;
//	else if(pw.length < 8) return false;
//	else if(16 < pw.length) return false;
//	else return true;
//}

/*
 * @name numCheck : 숫자 형식 체크
 * @param {String} val
 * @return {boolean}
 **/
function isNum(val){
	var Num = /^[0-9]/;
	j = 0;
	temp = "";

	for (i=0; i < val.length; i++) {
		temp = val.substring(i, i+1);

		if (!(Num.test(temp))) {
			j++;
		}
	}

	if (j>0) {
		return false;
	} else {
		return true;
	}
}

/*
 * @name isFloat : float 형식 체크
 * @param {String} val
 * @return {boolean}
 **/
function isFloat(val){
	var Num = /^([0-9]*)[\.]?([0-9])?$/;
	j = 0;
	temp = "";

	for (i=0; i < val.length; i++) {
		temp = val.substring(i, i+1);

		if (!(Num.test(temp))) {
			j++;
		}
	}

	if (j>0) {
		return false;
	} else {
		return true;
	}
}

/*
 * @name strKorCheck : 한글 형식 체크
 * @param {String} str
 * @return {boolean}
 **/
function isKorLang(str){
	var i, j = 0;
	var Alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var Digit = '1234567890<>?/\\+=-_)(*&^%$#@!.,;:\{\}[]\"\'\`\~';
	astr = Alpha + Digit;

	if (astr.length > 1) {
		for(i = 0; i < str.length; i++) {
			if(astr.indexOf(str.substring(i, i+1)) >= 0) {
				j++;
			}
		}
		if (j > 0) {
			return false;
		} else {
			return true;
		}
	}
}

/*
 * @name inputFocus : 입력창 포커스 변경
 * @param {String} srcInput : 소스입력창
 * @param {String} tarInput : 타켓변경 대상 입력창
 * @param {String} len : 입려문자 최대 길이
 * @return {boolean}
 **/
function inputFocus(srcInput, tarInput, len) {
	srcInput = srcInput+".value.length";
	tarInput = tarInput+".focus()";

	if (eval(srcInput) == len){
		eval(tarInput);
	}
}

/*
 * @name isPhoneNum : 전화번호 형식 체크
 * @param {String} num : 전화번호
 * @param {String} tp : 전화번호 타입
 * @return {boolean}
 **/
function isPhoneNum(num, tp) {
	num = num.split("-").join("");
	pre = num.substr(0,3);

	if (tp == "MOBILE") {
		if (!in_array(pre, arrPrefixMobile)) {
			return false;
		}
	} else if (tp == "PHONE") {
		if (!in_array(pre, arrPrefixPhone) && pre.substr(0,2) != "02" && pre.substr(0,2) != "15" && pre.substr(0,2) != "16" && !in_array(num.substr(0,4), arrPrefix4)) {
			return false;
		}
	} else if (tp == "NOT030PHONE") {
		if (!in_array(pre, arrPrefixPhone2) && pre.substr(0,2) != "02" ) {
			return false;
		}
	} else if (tp == "030") {
		if (pre != "030") {
			return false;
		}
	} else {
		if (!in_array(pre, arrPrefixMobile) && !in_array(pre, arrPrefixPhone) && pre.substr(0,2) != "02" && pre.substr(0,2) != "15" && pre.substr(0,2) != "16" && !in_array(num.substr(0,4), arrPrefix4)) {
			return false;
		}
	}

	if( num.substr(0,4) == "1515" ) {
		numbody = num.substr(4);
		if (numbody.length != 7) {
			return false;
		}
	} else if( num.substr(0,5) != "03030" ) {
		if( pre.substr(0,2) == "02" ) {
			numbody = num.substr(2);
		} else if( pre.substr(0,2) == "15" || pre.substr(0,2) == "16" ) {
			numbody = num;
		} else {
			numbody = num.substr(3);
		}

		if (numbody.length != 8 && numbody.length != 7) {
			return false;
		}
	} else {
		numbody = num.substr(5);
		if (numbody.length != 7 && numbody.length != 6) {
			return false;
		}
	}

	for (i=0;i < numbody.length; i++) {
		if ( parseInt( numbody.substr(i,1) ) + 0 != numbody.substr(i,1) ){
			return false;
		}
	}

	return true;
}

/* startsWith polyfill */
String.prototype.startsWith||function(){"use strict";var t=function(){try{var t={},r=Object.defineProperty,e=r(t,t,t)&&r}catch(t){}return e}(),r={}.toString,e=function(t){if(null==this)throw TypeError();var e=String(this);if(t&&"[object RegExp]"==r.call(t))throw TypeError();var i=e.length,n=String(t),o=n.length,a=arguments.length>1?arguments[1]:void 0,h=a?Number(a):0;h!=h&&(h=0);var c=Math.min(Math.max(h,0),i);if(o+c>i)return!1;for(var u=-1;++u<o;)if(e.charCodeAt(c+u)!=n.charCodeAt(u))return!1;return!0};t?t(String.prototype,"startsWith",{value:e,configurable:!0,writable:!0}):String.prototype.startsWith=e}();
/* endsWith polyfill */
String.prototype.endsWith||function(){"use strict";var r=function(){try{var r={},t=Object.defineProperty,e=t(r,r,r)&&t}catch(r){}return e}(),t={}.toString,e=function(r){if(null==this)throw TypeError();var e=String(this);if(r&&"[object RegExp]"==t.call(r))throw TypeError();var n=e.length,i=String(r),o=i.length,a=n;if(arguments.length>1){var h=arguments[1];void 0!==h&&(a=h?Number(h):0)!=a&&(a=0)}var c=Math.min(Math.max(a,0),n)-o;if(c<0)return!1;for(var u=-1;++u<o;)if(e.charCodeAt(c+u)!=i.charCodeAt(u))return!1;return!0};r?r(String.prototype,"endsWith",{value:e,configurable:!0,writable:!0}):String.prototype.endsWith=e}();
/* includes polyfill */
String.prototype.includes||function(){"use strict";var t={}.toString,r=function(){try{var t={},r=Object.defineProperty,e=r(t,t,t)&&r}catch(t){}return e}(),e="".indexOf,n=function(r){if(null==this)throw TypeError();var n=String(this);if(r&&"[object RegExp]"==t.call(r))throw TypeError();var i=n.length,o=String(r),l=o.length,c=arguments.length>1?arguments[1]:void 0,a=c?Number(c):0;return a!=a&&(a=0),!(l+Math.min(Math.max(a,0),i)>i)&&-1!=e.call(n,o,a)};r?r(String.prototype,"includes",{value:n,configurable:!0,writable:!0}):String.prototype.includes=n}();

/*
 * @name ltrim : 왼쪽 공백제거
 * @return {String}
 **/
String.prototype.ltrim = function() {
	var re = /\s*((\S+\s*)*)/;
	return this.replace(re, "$1");
}

/*
 * @name rtrim : 오른쪽 공백제거
 * @return {String}
 **/
String.prototype.rtrim = function() {
	var re = /((\s*\S+)*)\s*/;
	return this.replace(re, "$1");
}

/*
 * @name trim : 공백제거
 * @return {String}
 **/
String.prototype.trim = function() {
	return this.ltrim().rtrim();
}


/*
 * */
function GetOSName(){
    var OSName="Can't find OS Information";

    //The below few line of code will find the OS name
    if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
    if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
    if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
    if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";

    return OSName;
}

function GetOSVersion(){
    var OSVer="";
    if (navigator.userAgent.indexOf("Mac OS X 10.4")!=-1) OSVer="Tiger";
    if (navigator.userAgent.indexOf("Mac OS X 10.5")!=-1) OSVer="Leopard";
    if (navigator.userAgent.indexOf("Mac OS X 10.6")!=-1) OSVer="Snow Leopard";
    if (navigator.appVersion.indexOf("NT 5.1")!=-1) OSVer="XP";
    if (navigator.appVersion.indexOf("NT 6.0")!=-1) OSVer="Vista";
    if (navigator.appVersion.indexOf("NT 6.1")!=-1) OSVer="7";
    if (navigator.appVersion.indexOf("NT 6.2")!=-1) OSVer="8";
    if (navigator.appVersion.indexOf("NT 6.3")!=-1) OSVer="8.1";
    if (navigator.appVersion.indexOf("NT 7.0")!=-1) OSVer="9";

    return OSVer;
}

function GetWindowsBitType(){
    var Agent = navigator.userAgent.toLowerCase();
    if( Agent.indexOf("wow64") > -1 || Agent.indexOf("win64") > -1 )
        ieBitVersion = "64";
    else
        ieBitVersion = "32";

    return ieBitVersion;
}

function GetIEInfo(){
  var Agent = navigator.userAgent.toLowerCase();
	var nowBrowser="";
	if(Agent.indexOf("chrome") > -1){
		nowBrowser = "Chrome";
	}else if(Agent.indexOf("safari") > -1){
		nowBrowser = "Safari";
	}else if(Agent.indexOf("firefox") > -1){
		nowBrowser = "Firefox";
	}else if(Agent.indexOf("msie") > -1 || Agent.indexOf("trident") > -1){
		nowBrowser = "Internet Explorer";

	    //Internet Explore 버전
	    var ieVersion;
	    var trident = Agent.match(/Trident\/(\d.\d)/i);
	    if( trident == null )    {
		    ieVersion = parseInt(navigator.userAgent.charAt(30));
	    } else if( trident[1] == "4.0" ) {
		    ieVersion = "8";
	    } else if( trident[1] == "5.0" ) {
		    ieVersion = "9";
	    } else if( trident[1] == "6.0" ) {
		    ieVersion = "10";
	    } else if( trident[1] == "7.0" ) {
		    ieVersion = "11";
	    } else {
		    ieVersion = "?";
	    }

	    nowBrowser += ieVersion;
	} else {
		nowBrowser = "NOT_SUPPORT";
	}

  return nowBrowser;
}

/**
 * <pre>
 * radiobox, checkbox에 default값 처리
 * </pre>
 *
 * @author 서성일
 * @create 2018.09.12
 */
function fnChecked(obj, val, context) {
	var context = context || window;
	//console.log("input.type="+$("#"+obj).attr("type"));
	if (context.$("#"+obj).val() != undefined && context.$("#"+obj).val() != null) {
		if (context.$("#"+obj).attr("type").toLowerCase() == "radio") {
			context.$('input[name="'+obj+'"]:radio[value="'+ val +'"]').prop('checked',true);
		}
	}
}

/**
 * <pre>
 * selectbox에 default값 처리
 * </pre>
 *
 * @author 서성일
 * @create 2018.09.12
 */
function fnSelected(obj, val, context) {
	var context = context || window;
	/*target = document.getElementById(obj);
	if ($("#"+obj).val() != undefined && $("#"+obj).val() != null) {
		target.options[idx].selected = true;
	}*/
	if (context.$("#"+obj).val() != undefined && context.$("#"+obj).val() != null) {
		context.$("#"+obj+" > option[value='"+ val +"']").attr("selected", "true"); //value값으로 선택
	}
}

/**
 * <pre>
 * form에 있는 항목들을 Json형태로 변환 처리
 * </pre>
 *
 * @author 김지겸
 * @create 2018.09.13
 */
function fnFormToJson(formData, context){
	var context = context || window;
	if(!context.real){
		context.real = function(input){ return input; };
		context.unreal = function(input){ return input; };
	}
	var rslt = [];
	var obj = {};
	//
	context.$("#"+formData).find('span').each(function(idx, el){
		obj[context.unreal(el.id)] = $(this).text();
	});
	context.$("#"+formData).find('input').each(function(idx, el){
		if(this.type.toLowerCase() == "radio"){
			obj[context.unreal(el.id)] = context.$(':radio[name='+context.unreal(el.id)+']:checked').val();
		}else if(this.type.toLowerCase() == "checkbox"){
			obj[context.unreal(el.id)] = context.$('#'+el.id)[0].checked;
		}else{
			obj[context.unreal(el.id)] = el.value;
		}
	});
	context.$("#"+formData).find('textarea').each(function(idx, el){
		obj[context.unreal(el.id)] = el.value;
	});
	context.$("#"+formData).find('select').each(function(idx, el){
		obj[context.unreal(el.id)] = el.value;
	});
	//
	rslt.push(obj);
	return rslt;
}
//
function fnNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
//
function pop_center(){
	$(".popup_edge").each(function(index, elem) {
		var elem = $(elem);
		var p_hi = $(this).height() / -2;
		var p_wi = $(this).width() / -2;
		elem.css("margin-top", p_hi);
		elem.css("margin-left", p_wi);
	});
	$(".popup_bg").show();
//	$(".popup_edge").draggable();
};

//페이지 초기화
function fnPageInit() {
	location.reload();
}

/**
 * <pre>
 * 그리드 데이터 엑셀 다운로드
 * </pre>
 *
 * @author 서성일
 * @create 2018.10.16
 */
function fnGridDataExcelDown(gridObj, filNm) {
	if(gridObj == undefined || gridObj == null) {
		alert("다운로드할 데이터가 없습니다.");
		return false;
	}

	var provider = gridObj.getDataProvider();
	var datas = provider.getJsonRows();
	if (datas == null || datas.length == 0) {
		alert("다운로드할 데이터가 없습니다.");
		return false;
	}

	if(confirm("엑셀다운로드 하시겠습니까?")) {
		var excelType = "2007"; //$(':radio[name="excelType"]:checked').val() == "2007";
		var showProgress = true; //$("#chkShowProgress").is(":checked");
		var applyDynamicStyles = false; //$("#chkApplyDynamicStyles").is(":checked");

		gridObj.exportGrid({
			type: "excel",
			target: "local",
			fileName: filNm,
			showProgress: showProgress,
			applyDynamicStyles: applyDynamicStyles,
			progressMessage: "엑셀 Export중입니다.",
			indicator: "hidden", //$(':radio[name="indicator"]:checked').val(),
			header: "visible", //$(':radio[name="header"]:checked').val(),
			footer: "hidden", //$(':radio[name="footer"]:checked').val(),
			compatibility: excelType,
			done: function() {
				console.log("done excel export");
			}
		});
	}
}

function f2o(form, context){
	var o = {};
	$('input:not([type=submit]),select,textarea', form).each(function(i, el){
		var name = el.name || (context? context.unreal(el.id) : el.id);
		var value = null;

		if(el.tagName.toLowerCase() == 'input'){
			switch(el.type){
			case 'text':
			case 'number':
				value = el.value;
				break;
			case 'radio':
			case 'checkbox':
				if(el.checked){
					value = el.value;
				}else{
					return;
				}
				break;
			}
		}else{
			value = el.value;
		}

		if(o.hasOwnProperty(name)){
			if($.isArray(o[name])){
				o[name].push(el.value);
			}else{
				o[name] = [o[name], el.value];
			}
		}else{
			o[name] = el.value;
		}
	});
	return o;
}

var Map = function (obj)
{
	var mapData = (obj != null) ? cloneObject(obj) : new Object();
	this.put = function(key, value) {
		mapData[key] = value;
	};
	this.get = function(key) {
		return mapData[key];
	};
	this.remove = function(key) {
		for (var tKey in mapData) {
			if (tKey == key) {
				delete mapData[tKey];
				break;
			}
		}
	};
	this.keys = function() {
		var keys = [];
		for (var key in mapData) {
			keys.push(key);
		}
		return keys;
	};
	this.values = function() {
		var values = [];
		for (var key in mapData) {
			values.push(mapData[key]);
		}
		return values;
	};
	this.containsKey = function(key) {
		for (var tKey in mapData) {
			if (tKey == key) {
				return true;
			}
		}
		return false;
	};
	this.isEmpty = function() {
		return (this.size() == 0);
	};
	this.clear = function() {
		for (var key in mapData) {
			delete mapData[key];
		}
	};
	this.size = function() {
		var size = 0;
		for (var key in mapData) {
			size++;
		}
		return size;
	};
	this.getObject = function() {
		return cloneObject(mapData);
	};
	var cloneObject = function(obj) {
		var cloneObj = {};
		for (var attrName in obj) {
			cloneObj[attrName] = obj[attrName];
		}
		return cloneObj;
	};
};


function fnException(response){
	if(top !== window){
		top.postMessage({
			  eventSourceType: 'ex'
			, option: response
		}, "*");
	}
}

/* 입법정보 관련 */
$(window).load(function () {
	//PERIOD : four-period - 리뉴얼팀 처리 : 2014.09.11 You-Jung.Jung  주요내용 ？ 치환
	$(".ecc-change").each(function(){
		var eccText = $(this).text();
		//eccText = eccText.replace(/？/gi, "ㆍ");
		eccText = eccText.replace(/[?？]+/gi, "ㆍ");
		$(this).text(eccText);
	});

	//상세 검색 시 상세 검색 박스를 기본으로 보여준다.
	if ($("#srch_detail").val() == "on") {
		$(".srch_detail").show();
		$("#srch_detail").val("on");
		$(".srch_simple .more.open").hide();
		$(".srch_simple .more.close").show();
		$(this).hide();
	}

	//검색조건 접기/펼치기
	$(document).delegate('.srch_simple .more.open', 'click', function() {
		$(".srch_detail").show();
		$("#srch_detail").val("on");
		$(".srch_simple .more.close").show();
		$(this).hide();
	});

	$(document).delegate('.srch_simple .more.close', 'click', function() {
		$(".srch_detail").hide();
		$("#srch_detail").val("off");
		$(".srch_simple .more.open").show();
		$(this).hide();
	});

	//검색조건 접기/펼치기
	$(document).delegate('.srch_simple_sub .more.open', 'click', function() {
		$(".srch_detail").show();
		$("#srch_detail").val("on");
		$(".srch_simple_sub .more.close").show();
		$(this).hide();
	});

	$(document).delegate('.srch_simple_sub .more.close', 'click', function() {
		$(".srch_detail").hide();
		$("#srch_detail").val("off");
		$(".srch_simple_sub .more.open").show();
		$(this).hide();
	});


	//이미지 롤오버
	$(".imgOver").addClass("pointer");
	$(document).delegate('.imgOver', 'mouseover', function () {
		var src = $(this).attr("src").replace(".gif", "_ov.gif");
		$(this).attr("src", src);
	}).delegate('.imgOver', 'mouseout', function () {
		var src = $(this).attr("src").replace("_ov.gif", ".gif");
		$(this).attr("src", src);
	});

	// 닫기
	$('#close').click(function(e) {
		window.close();
		return false;
	});

	// 닫고 부모창 refresh
	$('#closeAndRefresh').click(function() {
		window.close();
		window.opener.location.reload();
		return false;
	});

	// 닫고 부모창 refresh하는 버튼이 존재한다면
	// 윈도우 창 닫기 버튼 클릭시에도 부모창이 갱신되게 함
	// Form Submit인 경우에는 beforeunload 이벤트 제외
	if ($('#closeAndRefresh').length > 0) {
		$(window).bind('beforeunload', function() {
			window.opener.location.reload();
		});
	}

	// layer close event binding
	$('.layer_close').click(function(event) {
		$(event.currentTarget).parents('.pop_regist_comments').removeClass('on');
		//파일을 등록하고 나서 취소를 할 경우 기존 정보가 남아있어서 삭제해 준다.
		//입법의견
		$('#lmOpnMainFlDiv').find('span').remove();
		$('#lmOpnMainFlDiv').find('br').remove();
		$('#lmOpnMainFlDiv').find('input[name = rplyFlSeq]').remove();
		$('#wrkSeqMain').val(0);
		$('#wrkSeqNmMain').val('');
		$('#rplyCtsMain').val('');
		//시스템질의
		$('#stmInqMainDiv').find('span').remove();
		$('#stmInqMainDiv').find('br').remove();
		$('#stmInqMainDiv').find('input[name = flSeqs]').remove();
		$('#stmInqVoMain').find('select[name = inqClsCd]').val('ALL');
		$('#stmInqVoMain').find('input[id = inqTtl]').val('');
		$('#stmInqVoMain').find('textarea[id = stmInqCts]').val('');
		$('#stmInqVoMain').find('select[name = srchCate]').val('');

	});

	// 상단 이미지 버튼 toggle
	/*$('.util_m li a').click(function(i, elem) {
		$('.util_m li a img').each(function(i, elem) {
			$(elem).attr('src', $(elem).attr('src').replace('_on', '_off'));
			$(elem).parent().removeClass('on');
		});
		$(this).find('img').attr('src', $(this).find('img').attr('src').replace('_off', '_on'));
		$(this).addClass('on');
	});*/

	// 보안 로그인 활성화
	$('#secureLoginChk').click(function () {
		if ($(this).is(':checked')) {
			$.osIndicator(true);
			setTimeout(function(){
				kdefense_run();
				$.osIndicator(false);
			}, 0);
		}
	});

	$('textarea.autosize').each(function(){
		$(this).autosize();
		$(this).setMethod({set : function($textarea, val){
			$textarea.val(val).trigger('autosize.resize');
			return val;
		}});
	});

});

function snsPopUp(){
	openPopup('/html/snsLoginInformation.html', {target:'infor', width:'560', height: '463', scrollbars:'no' });
}

function transGuid(){
	openPopup('/html/transGuid.html', {target:'infor', width:'560', height: '752', scrollbars:'no' });
}

//팝업 열기
// TODO 수정 요망
function openPopup(url, winName, height) {
	// default attributes
	var attrs = {
		target : '_blank',
		width : 790,
		height : 550,
		menubar : 'no',
		toolbar : 'no',
		location : 'no',
		status : 'no',
		resizable : 'no',
		fullscreen : 'no',
		scrollbars : 'yes'
	};

	// TODO 기존 openPopup를 쓰는 곳이 너무 많아서 각자 직접 수정 후
	// 더이상 쓰는 곳이 없어지면 파라미터 세개 -> 두개로 수정

	var popStatus = null;

	// 기존 default 속성과 파라미터로 넘어온 속성 병합
	if (arguments.length == 2) {
		// parameter : url, attr
		var attrString = '';
		for (var attr in attrs) {
			if (arguments[1][attr] !== undefined) {
				attrs[attr] = arguments[1][attr];
			}
			attrString += attr + '=' + attrs[attr] + ',';
		}

		attrString += 'left=' + (screen.width / 2 - attrs.width / 2) + ',';
		attrString += 'top=' + ((screen.height / 2 - attrs.height / 2) - 50) + '';

		//attrString = attrString.substring(0, attrString.length - 1);
		//alert("1:"+attrs.target);
		popStatus = window.open(url, attrs.target, attrString);

	} else if (arguments.length == 3) {
		// 삭제 예정
		// parameter : url, winName, height
		//alert("2:"+winName);
		//alert(navigator.appName);
		//alert(new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent));
		var nLeft  = screen.width/2 - 395 ;
		var nTop  = (screen.height/2 - height/2) - 50 ;

		/* 엘리스에서는 왜 이랬을까... 일단 돌려놓고 문제생기면 풀어야 함. 20150828 벌꿀처럼 일하는 bluewish
		if((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null)){
			popStatus = window.open(url, winName); //(ie11 인 경우 추가 2013.03.16)
		}else{
			popStatus = window.open(url, winName, "width=790" + ",height=" + height  + ",left=" + nLeft + ",top=" + nTop + ",toolbar=no,menubar=no,location=no,scrollbars=yes,status=no");
		}*/
		popStatus = window.open(url, winName, "width=790" + ",height=" + height  + ",left=" + nLeft + ",top=" + nTop + ",toolbar=no,menubar=no,location=no,scrollbars=yes,status=no");
	}

	//팝업창에 포커스 주기
	if (null != popStatus && !popStatus.closed) {
		popStatus.focus();
		return popStatus; //(수정 2013.03.16)
	}

	if (null != popStatus) {
		popStatus.focus();
	}
}

//팝업 열기(너비 지정)
// 삭제 예정
function openPopupWidth(url, winName, width, height) {
	var nLeft  = screen.width/2 - width/2 ;
	var nTop  = (screen.height/2 - height/2) - 50 ;
	window.open(url, winName, "width=" + width + ",height=" + height  + ",left=" + nLeft + ",top=" + nTop + ",toolbar=no,menubar=no,location=no,scrollbars=yes,status=no");
}

function openLoginPopup() {
	openPopup('/loginPopup', {target:'login', width:300, height:220});
}

/* A 태그 event return */
function event_return (event)
{
	if (window.event) window.event.returnValue = false;
	else event.preventDefault();
}


/*
NAME:	SetCookie()
DESC: 	쿠키에 값을 설정한다.
param:  name, value, expries
return:
author: 정태섭
*/
function SetCookie (name, value) {
   var argv = SetCookie.arguments;
   var argc = SetCookie.arguments.length;
   var expires = (2 < argc) ? argv[2] : null;

   document.cookie = name + "=" + escape (value) + "; path=/" +
      ((expires == null) ? "" :
         ("; expires=" + expires.toGMTString()));
}

/**
 * 쿠키 값 가져오기
 * @param name 쿠키 값
 */
function getCookie(name) {
	return $.cookie(name); // => 'the_value'
}

/**
 * OO일동안 이 창 열지 않기
 */
function closeWin(name, expiredays) {
	setCookie(name, "no", expiredays);
}

/**
 * 쿠키 값 셋팅
 * @param name 쿠키 값
 * @param val yes/no
 * @param expiredays 만료일
 */
function setCookie(name, val, expiredays) {
	$.cookie(name, val, { expires: expiredays, path: '/' });
}


/**
 * 파라미터로 넘어온 object를 통해 queryString을 생성한다.
 * @param {Object} Query String으로 만들기 위한 대상 object
 * @returns {Array} Query String Array
 * @author parkdongjin
 */
function EncodeQueryData(data)
{
   var ret = [];
   for (var d in data) {
	   if (typeof d !== "function") {
		   ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
	   }
   }
   return ret.join("&");
}

/**
 * 포커스 획득 시 디폴트 내용이라면 내용을 삭제하고
 * 포커스를 잃었을 때 내용이 없다면
 * 디폴트 내용을 보여준다.
 * @param ele 대상 element
 * @param str 디폴트 내용
 */
function focusEvnt(ele,str){

	$(ele).focusin(function(e,str1) {
		if($(this).val() === str){
			$(this).val('');
		}
	}).focusout(function(e,str1) {
		if($(this).val() === ''){
			$(this).val(str);
		}
	});
}

/**
 * 빈 객체인지 확인
 * @param obj
 * @returns
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function isEmpty(obj) {
	if (obj == null) {
		return true;
	}
	if (obj === '') {
		return true;
	}
	if (obj.length > 0) {
		return false;
	}
	if (obj.length === 0) {
		return true;
	}

	for (var key in obj) {
		if (hasOwnProperty.call(obj, key)) {
			return false;
		}
	}
	return true;
}
/** 단건 input 내용 삭제
*  ex) removeInputValue('id1']);
**/
function removeInputValue(input) {
	$('#' + input).val("");
}
/** 다건 input 내용 삭제
 *  ex) removeInputValues(['id1', 'id2']);
 **/
function removeInputValues(inputs) {
	for (var i = 0; i < inputs.length; i++) {
		$('#' + inputs[i]).val("");
	}
}
/*
 *   prototype declare
 */

/* trim */
String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)|($\s*)/g, "");
};

/* String byte 수 체크 */
String.prototype.getByte = function(){
	var len = 0;
	var itill = this.length;
	for (var idx=0 ; idx < itill ; idx++, len++)   {
		if ( (this.charCodeAt(idx)<0) || (this.charCodeAt(idx)>127) ) len ++;
	}
	return len;
};

/* utf-8 문자열의 바이트수 체크(확인요망) */
String.prototype.getUtf8Byte = function(){
	var len = 0;
	var itill = this.length;
	for (var idx=0 ; idx < itill ; idx++, len++){
		var charCode = ch.charCodeAt(0);
		if (charCode <= 0x00007F){
			len++;
		} else if (charCode <= 0x0007FF){
			len += 2;
		} else if (charCode <= 0x00FFFF){
			len += 3;
		} else {
			len += 4;
		}
	}
	return len;
};

/**
 * short string
 * @param len 자를 길이
 * @returns {String} 잘라진 문자열
 */
String.prototype.cut = function(len) {
	var str = this;
	var l = 0;
	for (var i = 0; i < str.length; i++) {
		l += (str.charCodeAt(i) > 128) ? 2 : 1;
		if (l > len) {
			return str.substring(0, i) + "...";
		}
	}
	return str.toString();
};

String.prototype.tsDateFormat = function() {
	// 날짜 타입이 yyyyMMDD 라고 가정
	var dateValue = new Date(this.substring(0, 4), Number(this.substring(4, 6)) - 1, this.substring(6, 8));
	return dateValue.getFullYear() + '. ' + Number(dateValue.getMonth() + 1) + '. ' + Number(dateValue.getDate()) + '.';
};

String.prototype.tsDateFormatHyphen = function() {
	// 날짜 타입이 yyyy-MM-DD 라고 가정
	var hyphen = this.replace(/-/gi, '');
	var dateValue = new Date(hyphen.substring(0, 4), Number(hyphen.substring(4, 6)) - 1, hyphen.substring(6, 8));
	return dateValue.getFullYear() + '. ' + Number(dateValue.getMonth() + 1) + '. ' + Number(dateValue.getDate()) + '.';
};

String.prototype.escapeHtml = function() {
	return this.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
};

//String 첫글자 대문자로 변경
String.prototype.capltalizeFirstLetter = function(){
	return this.charAt(0).toUpperCase()+this.slice(1);
}

/**
 * 배열의 prototype에 확장함수를 등록해 버리면
 * 루프는 어케 돌리라고!!!!!
 * 일단 막음.
 * */
/**
 * 배열에 값이 존재하는지 확인
 */
/*Array.prototype.contains = function(element) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == element) {
			return true;
		}
	}
	return false;
};*/
function arrayContains(arr, element){
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == element) {
			return true;
		}
	}
	return false;
}

/**
 * Array객체에서 특정 index object를 삭제하고
 * 뒤쪽 objects를 앞쪽으로 이동해 빈공간을 메운다.
 * @param {int} 인덱스
 * @returns {Array} 가공된 array
 * @author parkdongjin
 */
/*Array.prototype.remove = function(idx) {
    return (idx < 0 || idx > this.length) ? this : this.slice(0, idx).concat(this.slice(idx + 1, this.length));
};*/
function arrRemove(arr, idx){
	return (idx < 0 || idx > arr.length) ? arr : arr.slice(0, idx).concat(arr.slice(idx + 1, arr.length));
}


/**
 * 차집합을 구한다.
 * @param {Array} 집합 B (this => 집합 A)
 * @returns {Array} 가공된 array
 * @author parkdongjin
 */
/*Array.prototype.minusSet = function(target) {
	var result = [];

	var array = this;
	if (target.length == 0) {
		return array;
	}

	for( var i = 0; i < array.length; i++) {
		for (var j = 0; j < target.length; j++) {
			if (array[i] == target[j]) {
				break;
			}

			// 같은게 없다면
			if (j == target.length - 1) {
				result.push(array[i]);
			}
		}
	}
	return result;
};*/
function arrayMinusSet(arr, target){
	var result = [];

	var array = arr;
	if (target.length == 0) {
		return array;
	}

	for( var i = 0; i < array.length; i++) {
		for (var j = 0; j < target.length; j++) {
			if (array[i] == target[j]) {
				break;
			}

			// 같은게 없다면
			if (j == target.length - 1) {
				result.push(array[i]);
			}
		}
	}
	return result;
}

//법령안 심사자 명단 팝업
function legislativeOfficerInfo() {
	openPopup("/html/legislativeOfficerInfo.jsp", {target:'legislativeOfficerInfo', width:820, height:820});
}

//법령안 심사자 명단 팝업
function legislativeOfficerInfoPop() {
	openPopup("/govLm/lm/admPrvExm/legislativeOfficerInfo", {target:'legislativeOfficerInfo', width:820, height:820});
}

//법령정비 도움말
function lawMakeHelp() {
    openPopup("/html/lawMakeHelp.html", {target:'lawMakeHelp', width:820, height:860});
}

//의원입법지원 도움말
function asembyLgsltHelp() {
    openPopup("/html/asembyLgstOfiHelp.html", {target:'asembyLgstHelp', width:820, height:860});
}

//사전심사 도움말
function prvSptWrkHelp() {
    openPopup("/html/prvSptWrkOfHelp.html", {target:'prvSptWrkOfHelp', width:820, height:860});
}

/**
 * array copy(deep)
 * @returns 복제된 array
 */
/*Array.prototype.clone = function() {
	return this.slice(0);
};*/
function arrClone(arr){
	return arr.slice(0);
}

var script = new Object();

/**
 * 해당 Row 삭제
 * @param obj
 */
script.deleteRow = function(obj) {
	$(obj.parentNode).remove();
};

/**
 * name과 value를 별도로 받아 hidden으로 넘겨준다.
 * @param obj
 * @param name
 * @param val
 */
script.appendHiddenForm = function(obj, name, val) {
	if (confirm('삭제하시겠습니까?')) {
		$(obj.parentNode).attr('style', "display:none;");
		var hiddenForm = "<input type='hidden' name='" + name + "' value='" + val +"'/>";
		$(obj.parentNode.parentNode.parentNode).append(hiddenForm);
	}
};


/**
 * title명 변경
 * @param id
 */
script.changeTitle = function changeTitle(id) {
	$("#" + id).attr('title', $("#" + id + " option:selected").text());
};

//PERIOD : four-period - 리뉴얼팀 처리

/**
 * 정부정책법안현황 주요내용 접기/펼치기
 */
$(document).delegate('.srch_simple2 .more2.open', 'click', function() {
	$(".srch_simple2 .more2.close").show();
	$(this).hide();
});

$(document).delegate('.srch_simple2 .more2.close', 'click', function() {
	$(".srch_simple2 .more2.open").show();
	$(this).hide();
});

/**
 * 정부정책법안현황 관련 조문 접기/펼치기
 */
$(document).delegate('.srch_simple3 .more3.open', 'click', function() {
	$(".srch_simple3 .more3.close").show();
	$(this).hide();
});

$(document).delegate('.srch_simple3 .more3.close', 'click', function() {
	$(".srch_simple3 .more3.open").show();
	$(this).hide();
});

/**
 * 소관부처 선택 시 부서목록 가져오기
 * 	<select> <- 부처selectbox
 * 		<option/>....
 * 	</select>
 * 	<select> <- 부서selectbox
 * 		<option/>....
 * 	</select>
 * 	위와같이 부처 object 바로 다음 부서 object가 있어야만 돌아감
 */
function changeOfiToDpt(obj) {
	var ofiCd = $(obj).val();
	var $dptObj = $(obj).next();
	$dptObj.children().remove();

	if (ofiCd != ""){
		document.block();
		$.ajax({
			type: "GET",
			dataType: "json",
			url: "/org/dpt/tree/filterData.json?orgCd=" + ofiCd,
			success: function(data) {
					//소관부서 셀렉트박스목록 세팅
					if(data.result != undefined){
						$dptObj.append($("<option/>").val("").attr("label","선택"));
						for(var i = 0 ; i < data.result.length ; i++) {
							$dptObj.append($("<option/>").val(data.result[i].orgCd).append(data.result[i].orgNm));
						}
					}
					document.unblock();

					if(!ObjectUtil.isEmpty($("#getDptCd").val())){
						$dptObj.val($("#getDptCd").val());
					}

			}, error : function() {document.unblock();}
		});
	} else {
		$dptObj.append($("<option/>").val("").attr("label","부처를 선택해주세요."));
		document.unblock();
	}
}


//소관부처 변경 팝업 tree
function cmmChangeAsndOrg(orgCdId) {
	var popupUrl = "/org/selOrg/tree?orgCd=" + $("#"+orgCdId).val();
	openPopup(popupUrl, {width:500, height:490});
};

function getLsRprInsParam(lsRprInsParam, clsCd, path){
	if(!ObjectUtil.isEmpty(lsRprInsParam)){
		var paramSplit = lsRprInsParam.split(":");
		var lsRprParamSvc = Ajax.getInstance("nl4ts.LsRprItmService");
		lsRprParamSvc.setMethodNm("selectLsRprParam");
		lsRprParamSvc.setParams("lbicId", paramSplit[0]);
		lsRprParamSvc.setParams("rprLsClsCd", paramSplit[1]);
		lsRprParamSvc.setParams("rprLsIdfnNo", paramSplit[2]);
		lsRprParamSvc.invoke(function(rtnData){
			lsRprInsParamSet(rtnData, clsCd, path);
		});
	}
}

function lsRprInsParamSet(param, clsCd, path){
	try {
		document.block();
		var $pNm0Obj = $("#lsNmKo");
		var $pNm1Obj = $("#essCts");
		var $addHtml = $("<div/>");
		$("#frLsRprId").val(param.lbicId+":"+param.rprLsClsCd+":"+param.rprLsIdfnNo);
		switch(clsCd){
			case "lsRpr" :
		 		$("#srcCd").val("AB0515");
				break;
			case "admRul" :
				$pNm0Obj = $("#admRulNm");
				$pNm1Obj = $("#rprStsNt");
				$addHtml = $("<li/>");
		 		$("#lmRsnCd").val("BC0411");
				break;
			case "rprordrul" :
				$pNm0Obj = $("#ordinNm");
				$pNm1Obj = $("#essCts");
		 		$("#lmRsnCd").val("AB0515");
				break;
			default : break;
		}

		if(!ObjectUtil.isEmpty(param.rprItm)) $pNm0Obj.val(param.rprItm);
		if(!ObjectUtil.isEmpty(param.rprItmDtl)) $pNm1Obj.val(StringUtil.replaceAll(param.rprItmDtl, '||', '\r\n'));
		if(!ObjectUtil.isEmpty(param.lsiSeq) && !ObjectUtil.isEmpty(param.lsNmKo) && !ObjectUtil.isEmpty(param.lsClsNm)){
			var setParam = "["+param.lsClsNm+"] "+param.lsNmKo;
			var $setInput = $("<input/>").attr({"type" : "hidden", "id" : "lsNms", "name" : "lsNms"});

			$addHtml.append($("<input/>").attr({"type" : "hidden", "id" : "lsiSeqs", "name" : "lsiSeqs"})
															.val(param.lsiSeq));
			var $delImg = $("<a/>").attr({"href":"javascript:;", "title":"삭제"});
			$delImg.append($("<img/>").attr({"src":path+"/btn/btn_del.gif"})
														.addClass("mb2")
														.on("mouseover" , function(){
															$(this).attr("src",path+"/btn/btn_del_ov.gif");
														})
														.on("mouseout" , function(){
															$(this).attr("src",path+"/btn/btn_del.gif")
														})
												);

			if(clsCd === "lsRpr"){
				$addHtml.append($setInput.val(param.lsNmKo));
				$addHtml.append("- ["+param.lsClsNm+"] "+param.lsNmKo);
				$addHtml.append("&nbsp;").append($delImg.click(function(){script.deleteRow(this);}));
				if(!ObjectUtil.isEmpty(param.flSeq) && !ObjectUtil.isEmpty(param.flNm)){
					var $flDiv = $("#lmPlnFlDiv");
					var $div = $("<div/>").css("margin-top","-20px");
					var $flSeqsInput = $("<input/>").attr({"id":"reqLsFl", "name":"flSeqs", "type":"hidden"}).val(param.flSeq);
					var $flNmSpan = $("<span/>").attr("id","lmPlnFlDiv_lmPlnFlSpan").text(param.flNm);
					var $delBtn = $("<a/>").attr("href","javascript:;").click(function(){
																	$flSeqsInput.remove();
																	$flNmSpan.remove();
																});
					var $btnImg = $("<img/>").attr({"src":"/images/btn/btn_del.gif", "alt":"삭제"});
					$delBtn.append("&nbsp;").append($btnImg);
					$flNmSpan.append($delBtn);
					$div.append($flNmSpan);
					$div.append($flDiv.find("a"));
					$flDiv.append($div);
					$flDiv.append($flSeqsInput);
					$flDiv.append($flDiv.find("input"));
				}

			}else if(clsCd === "admRul"){
				$addHtml.append($setInput.val(setParam));
				$addHtml.append($("<span/>").addClass("blockEm").css("width","400px").append("- "+setParam) );
				$addHtml.append($("<span/>").addClass("blockEm")); //??? 왜 있는거지??
				$addHtml.append("&nbsp;").append($delImg.click(function(){deleteRowLsSlt(this);}));
				$("#addBtn").remove();

				var $addBtn = 	$("<span/>").attr("id","addBtn").append($("<a/>").attr("href","javascript:;"));
				$addBtn.click(openPopLsSlt);
				$addBtn.append($("<img/>").attr({"src":path+"/btn/btn_add.gif", "alt":"더하기"}));
				$addHtml.append("&nbsp;").append($addBtn);

			}else if(clsCd === "rprordrul"){
				$("#libcId").val(param.lbicId); //자치쪽화면 오타이지만 이렇게 쓸수밖에 ...ㄷㄷ
				$("#lsNmKo").val(param.lsNmKo);

			}

			$("#lsSltList").append($addHtml);
		}

		document.unblock();
	} catch (e) {
		alert("조회중 오류가 발생했습니다." + e);
		document.unblock();
	}


}

function pollOpinion(click){

	var time = new Date();
	var year = time.getFullYear() + "";
	var month = (time.getMonth() + 1)+"";
	var date = time.getDate()+"";
	var hours = time.getHours()+"";

	if(month.length == 1) {
		month = "0" +	month;
	}

	if(date.length == 1) {
		date = "0" +	date;
	}

	if(hours.length == 1) {
		hours = "0" + hours;
	}

	var nowdate = Number(year + month + date+hours);
	var stdt =	"2018122000";
	var eddt = 	"2018123124";
//	console.log(nowdate >= stdt);
//	console.log(nowdate < eddt);
	if(nowdate >= stdt && nowdate < eddt ){		// 날짜 조건
//		if(getCookie("pollTempPopUp") == null){					// 내부망, 오늘하루 안보기 안한 대상자
//		if("${sessionScope.loginedUsr.usrTpCd}" == "CD0202" || "${sessionScope.loginedUsr.usrTpCd}" == "CD0204" || "${sessionScope.loginedUsr.usrTpCd}" == "CD0205" ){
//		 	if("${sessionScope.loginedUsr.asndOfiCd}" == "1170000")  													// 법제처
//			if("${sessionScope.loginedUsr.asndOfiCd}" == "1170000" && ("${sessionScope.loginedUsr.psCd}" == "284" 															// 법제관
//				|| "${sessionScope.loginedUsr.psCd}" == "279" || "${sessionScope.loginedUsr.psCd}" == "280" || "${sessionScope.loginedUsr.psCd}" == "281" || "${sessionScope.loginedUsr.psCd}" == "707"     // 국장
//				|| "${sessionScope.loginedUsr.psCd}" == "746" || "${sessionScope.loginedUsr.psCd}" == "750" || "${sessionScope.loginedUsr.psCd}" == "751"
//				|| "${sessionScope.loginedUsr.psCd}" == "709" || "${sessionScope.loginedUsr.psCd}" == "710" || "${sessionScope.loginedUsr.psCd}" == "711" || "${sessionScope.loginedUsr.psCd}" == "731"	  // 과장
//				|| "${sessionScope.loginedUsr.psCd}" == "735" || "${sessionScope.loginedUsr.psCd}" == "736" || "${sessionScope.loginedUsr.psCd}" == "747" || "${sessionScope.loginedUsr.psCd}" == "748"
//				|| "${sessionScope.loginedUsr.psCd}" == "749" || "${sessionScope.loginedUsr.psCd}" == "752" )){
//				return;
//			}

//			$.ajax({
//	            url : '/pollTemp/selectPollTempUsr.json',
//	            type : "GET",
//	            data : {
//	            	usrId : "${sessionScope.loginedUsr.usrId}",
//	            	pollSeq : '3'
//	            },
//	            dataType : "json",
//	            cache : false,
//	            success : function(data) {
//	            	if(data.result.success == 0){
	            		var url = "/pollTemp/selectPollOpinion";
	            		var attrs = {
	            				target : 'pollOpinion',
	            				width : 860,
	            				height : 800,
	            				menubar : 'no',
	            				toolbar : 'no',
	            				location : 'no',
	            				status : 'no',
	            				resizable : 'no',
	            				fullscreen : 'no',
	            				scrollbars : 'yes'
	            			};

	            			var popStatus = null;

	            			// 기존 default 속성과 파라미터로 넘어온 속성 병합
	            				// parameter : url, attr
            				var attrString = '';
            				for (var attr in attrs) {
//            					if (arguments[1][attr] !== undefined) {
//            						attrs[attr] = arguments[1][attr];
//            					}
            					attrString += attr + '=' + attrs[attr] + ',';
            				}

            				attrString += 'left=' + (screen.width / 2 - attrs.width / 2) + ',';
            				attrString += 'top=' + ((screen.height / 2 - attrs.height / 2) - 50) + '';

            				popStatus = window.open(url, attrs.target, attrString);

            				//팝업창에 포커스 주기
            				if (null != popStatus && !popStatus.closed) {
            					popStatus.focus();
            					return popStatus; //(수정 2013.03.16)
            				}

            				if (null != popStatus) {
            					popStatus.focus();
            				}

//	            	}else{
//	            		if(click){
//	            			alert('이미설문조사에 참여 하였습니다.');
//	            		}
//	            	}
//	            }
//	        });
//	    }
	}
}

function detectmob()
{
	 if( navigator.userAgent.match(/Android/i)
	 || navigator.userAgent.match(/webOS/i)
	 || navigator.userAgent.match(/iPhone/i)
	 || navigator.userAgent.match(/iPad/i)
	 || navigator.userAgent.match(/iPod/i)
	 || navigator.userAgent.match(/BlackBerry/i)
	 || navigator.userAgent.match(/Windows Phone/i)
	 ){
	    return true;
	  }
	 else {
	    return false;
	  }
}