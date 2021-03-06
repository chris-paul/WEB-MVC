import React, {Component} from 'react';
import {connect} from 'react-redux';

import {addTodo} from '../actions.js';

class AddTodo extends Component {

  constructor(props, context) {
    super(props, context);

    this.onSubmit = this.onSubmit.bind(this);
    this.refInput = this.refInput.bind(this);
  }

  onSubmit(ev) {
    ev.preventDefault();

    const input = this.input;
    if (!input.value.trim()) {
      return;
    }
    
    this.props.onAdd(input.value);
    input.value = '';
  }
  /**
   * react在render的时候,如果发现使用了ref属性,会立即执行这个函数,
   * 这个ref返回的是DOM节点,而不是virtual DOM 节点
   * @Author   LHK
   * @DateTime 2017-12-26
   * @param    {[type]}   node [description]
   * @return   {[type]}        [description]
   */
  refInput(node) {
    this.input = node;
  }

  render() {
    return (
      <div className="add-todo">
        <form onSubmit={this.onSubmit}>
          <input className="new-todo" ref={this.refInput} />
          <button className="add-btn" type="submit">
            添加
          </button>
        </form>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onAdd: (text) => {
      dispatch(addTodo(text));
    }
  }
};

export default connect(null, mapDispatchToProps)(AddTodo);