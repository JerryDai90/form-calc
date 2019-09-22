/**
 * 设计关键点：
 * 字段 A 的值为（表达式）：$form.A * $form.B
 * 字段 B
 *
 * 触发：
 * 当 B 改变的时候需要通知 A 重新计算表达式的值
 *
 */

(function (self) {

	let FORM_PREFIX = '$form.';

	self.parser = function () {
		var _parser = new Parser();
		_parser.functions.getUserName = function (userId) {
			return 'i m username:' + userId;
		};

		_parser.functions.concat = function (...obj) {
			let str = '';
			for (var x = 0; obj.length > x; x++) {
				str += obj[x];
			}
			return str;
		};

		_parser.functions.getOwnLeaveDay = function () {
			return 58;
		};
		return _parser;
	};

	/**
	 * 解析表达式中的字段（包含了表单、流程、系统变量）
	 * @param expression 表达式
	 */
	self.parseExpressionField = function (expression) {
		//这里解析出表达式中所使用到的字段信息，主要用于做逆向的值修改后可以被触发到
		let reg = /((\$form\.)|(\$flow\.)|(\$sys\.))+[a-zA-Z0-9\$]+/g;
		let match = expression.match(reg);
		return match || [];
	};

	/**
	 * 把表达式中的字段解析出来，用于判断值变化的时候需要触发那些变量重新计算
	 * @param formDatas 所有的表单数据
	 */
	self.parseFormFieldExpression = function (formDatas) {
		let allFormField = {};
		_.forEach(formDatas, function (form) {
			let formField = {
				watch: [],
				hide: [],
				readonly: [],
				required: [],
				inputRule: [],
				all: []
			};
			if (form.watch != undefined && form.watch.length >= 1) {
				//表单值变化监听字段
				_.forEach(form.watch, function (watchRow) {
					let expr = self.parseExpressionField(watchRow.expression);
					formField.watch = _.concat(formField.watch, expr);
				});
			}
			formField.hide = self.parseExpressionField(form.hide);
			formField.readonly = self.parseExpressionField(form.readonly);
			formField.required = self.parseExpressionField(form.required);

			_.forEach(form.inputRules, function (rule) {
				//TODO 这里的属性待确认
				if (rule.validateType == 'expr') {
					let expr = self.parseExpressionField(rule.regularOrExpression);
					formField.inputRule = _.concat(formField.inputRule, expr);
				}
			});

			formField.all = _.concat(formField.watch, formField.hide, formField.readonly, formField.required, formField.inputRule);

			allFormField[form.key] = formField;
		});
		return allFormField;
	};

	/**
	 * 解析
	 */
	self.parseNoticeFormKey = function (allParseExpressionField) {
		//这里是解析出整条通知链路（A 修改了 通知 B，B 修改了通知 C）
		//TODO 注意：这里没有处理环路的问题，这里只做了表单的

		//等待触发字段
		let allWait4fields = {};
		//触发字段(主触发字段)
		let triggerFields = [];

		//这里是字段
		_.forEach(allParseExpressionField, function (vExpressionFields, kFormName) {

			console.log(kFormName);

			//等待某些字段的通知
			let wait4fields = [];
			_.forEach(vExpressionFields.all, function (value) {
				if (FORM_PREFIX + kFormName != value) {
					let _v = value.replace(/((\$form\.)|(\$flow\.)|(\$sys\.))/g, '');
					wait4fields.push(_v);
					if (_.indexOf(triggerFields, _v)) {
						triggerFields.push(_v);
					}
				}
			});
			allWait4fields[kFormName] = wait4fields;
		});

		//触发字段映射，得出那些字段修改后需要被通知
		let triggerFieldsMap = {};

		_.forEach(triggerFields, function (tf, index) {
			triggerFieldsMap[tf] = [];

			_.forEach(allWait4fields, function (vW4f, kFormName) {
				let indexOf = _.indexOf(vW4f, tf);
				if (indexOf != -1) {
					triggerFieldsMap[tf].push(kFormName);
				}
			});
		});

		return triggerFieldsMap;
	};

	/**
	 * 处理表达式改变后触发的方法
	 * @type {{}}
	 */
	self.handle = {};

	/**
	 * 触发 watch 表达式语句（这里会直接更新表单的数据了）
	 * @param triggerField
	 * @param field
	 * @param expressionFields
	 * @param expressions
	 * @param variable
	 */
	self.handle.watchTrigger = function (triggerField, field, expressionFields, expressions, variable) {

		//先判断整个表达式中是否有需要被触发的字段
		if (self.utils.hasRunField(expressionFields, triggerField)) {
			_.forEach(expressions, function (expression, index) {
				//还要再去判断那一条的表达式需要执行（这里面有多条表达式）

				if (expression.indexOf(FORM_PREFIX + triggerField) != -1) {
					let val = self.utils.runExpression(expression, variable);
					variable.$form[field] = val;
					// console.log(val + '      ' + expression);
				}
			});
		}
	};

	self.utils = {
		/**
		 * 把 watch 的表达式转换一下成数组
		 * @param watchs
		 * @returns {Array}
		 */
		getWatchExpressionList: function (watchs) {
			let temp = [];
			_.forEach(watchs, function (expression, index) {
				temp.push(expression.expression);
			});
			return temp;
		},
		/**
		 * 获取指定的配置（依据表单字段名称）
		 * @param configs
		 * @param key
		 * @returns {*}
		 */
		getConfig: function (configs, key) {
			for (let i = 0; i < configs.length; i++) {
				if (configs[i].key == key) {
					return configs[i];
				}
			}
		},
		/**
		 * 运行表达式
		 * @param expression
		 * @param variable
		 * @returns {*}
		 */
		runExpression: function (expression, variable) {
			let expr = parser.parse(expression);
			return expr.evaluate(variable);
		},
		/**
		 * 判断是否有需要运行的字段
		 * @param allfields
		 * @param triggerField
		 * @returns {boolean}
		 */
		hasRunField: function (allfields, triggerField) {
			if (allfields.length != 0 && _.indexOf(allfields, FORM_PREFIX + triggerField) != -1) {
				return true;
			}
			return false;
		}
	};

}((window.form = {})));

