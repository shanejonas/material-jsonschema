import React     from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import Dialog               from 'material-ui/Dialog';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd           from 'material-ui/svg-icons/content/add';
import ContentCreate        from 'material-ui/svg-icons/content/create';
import ContentRemove        from 'material-ui/svg-icons/content/remove';
import FlatButton           from 'material-ui/FlatButton';
import Paginate             from './Paginate';
import Form                 from './Form';
import isFunc               from './isFunc';

const imageHeight = 44;

const widgetType = (schema, tableSchema) => {
  const type = schema.type;
  const widget = tableSchema && tableSchema['ui:widget'];
  if (isFunc(widget)) {
    return 'custom';
  }
  if (type === 'string') {
    if (schema.format === 'data-url') {
      if (widget === 'img') {
        return 'image';
      }
      if (widget === 'audio') {
        return 'audio';
      }
      return 'link';
    }
  }
  return 'text';
};

export const DialogType = {
  Hidden:  'Hidden',
  Destroy: 'Destroy',
  New:     'New',
  Edit:    'Edit',
};

class ResourceTable extends React.Component {
  static get propTypes() {
    return {
      schema:       PropTypes.object.isRequired,
      tableSchema:  PropTypes.object.isRequired,
      formSchema:   PropTypes.object.isRequired,
      items:        PropTypes.array.isRequired,
      page:         PropTypes.number.isRequired,
      perPage:      PropTypes.number.isRequired,
      pageCount:    PropTypes.number.isRequired,
      onPageChange: PropTypes.func.isRequired,
      canCreate:    PropTypes.bool,
      canEdit:      PropTypes.bool,
      canDestroy:   PropTypes.bool,
      onCreate:     PropTypes.func,
      onUpdate:     PropTypes.func,
      onDestroy:    PropTypes.func,
      onAction:     PropTypes.func,
    };
  }
  static get defaultProps() {
    return {
      canCreate:  true,
      canEdit:    true,
      canDestroy: true,
      onCreate:   () => {},
      onUpdate:   () => {},
      onDestroy:  () => {},
      onAction:   () => {},
    };
  }
  constructor(props) {
    super(props);
    this.state = {
      dialogType: DialogType.Hidden,
      item:       {},
    };
    this.handleEditDialogSubmit = this.handleEditDialogSubmit.bind(this);
    this.handleDestroyDialogSubmit = this.handleDestroyDialogSubmit.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleDialogCancel = this.handleDialogCancel.bind(this);
  }
  handleNewButtonClick() {
    this.setState({ dialogType: DialogType.New, item: {} });
  }
  handleEditButtonClick(item) {
    this.setState({ dialogType: DialogType.Edit, item });
  }
  handleDestroyButtonClick(item) {
    this.setState({ dialogType: DialogType.Destroy, item });
  }
  handleCreateDialogSubmit(item) {
    this.props.onCreate(item);
    this.setState({ dialogType: DialogType.Hidden });
  }
  handleEditDialogSubmit(item) {
    this.props.onUpdate(item);
    this.setState({ dialogType: DialogType.Hidden });
  }
  handleDestroyDialogSubmit() {
    this.props.onDestroy(this.state.item);
    this.setState({ dialogType: DialogType.Hidden });
  }
  handleDialogClose() {
    this.setState({ dialogType: DialogType.Hidden, item: {} });
  }
  handleDialogCancel() {
    this.setState({ dialogType: DialogType.Hidden, item: {} });
  }
  renderNewDialog() {
    return (
      <Dialog
        title={`New ${this.props.schema.title}`}
        open
        autoScrollBodyContent
        onRequestClose={this.handleDialogClose}
      >
        <Form
          schema={this.props.schema}
          formSchema={this.props.formSchema}
          item={this.state.item}
          onSubmit={item => this.handleCreateDialogSubmit(item)}
          submitButtonLabel="Create"
        />
      </Dialog>
    );
  }
  renderEditDialog() {
    return (
      <Dialog
        title={`Edit ${this.props.schema.title}`}
        modal={false}
        open
        autoScrollBodyContent
        onRequestClose={this.handleDialogClose}
      >
        <Form
          schema={this.props.schema}
          formSchema={this.props.formSchema}
          item={this.state.item}
          onSubmit={this.handleEditDialogSubmit}
          submitButtonLabel="Update"
        />
      </Dialog>
    );
  }
  renderDestroyDialog() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary
        keyboardFocused
        onTouchTap={this.handleDialogClose}
      />,
      <FlatButton
        label="OK"
        onTouchTap={this.handleDestroyDialogSubmit}
      />,
    ];
    return (
      <Dialog
        title="Confirmation"
        actions={actions}
        modal={false}
        open
      >
        {`Are you sure you want to the ${this.props.schema.title}?`}
      </Dialog>
    );
  }
  renderDialog() {
    switch (this.state.dialogType) {
      case DialogType.Hidden:
        return <Dialog open={false} />;
      case DialogType.New:
        return this.renderNewDialog();
      case DialogType.Edit:
        return this.renderEditDialog();
      case DialogType.Destroy:
        return this.renderDestroyDialog();
      default:
        return null;
    }
  }
  renderHeaderRows(entries) {
    const headerColumns = entries.map(([name]) => ((
      <TableHeaderColumn key={name}>{name}</TableHeaderColumn>
    )));
    headerColumns.push(
      <TableHeaderColumn key="actions">
        actions
      </TableHeaderColumn>);
    const { perPage } = this.props;
    return [
      <TableRow key="paginate">
        <TableHeaderColumn
          colSpan={entries.length + 1}
          style={{ textAlign: 'center' }}
        >
          <Paginate
            page={this.props.page}
            pageCount={this.props.pageCount}
            onChange={({ selected }) => this.props.onPageChange(selected, perPage)
            }
          />
          {this.props.canCreate ?
            <FloatingActionButton
              style={{ marginTop: 15, float: 'right' }}
              mini
              onTouchTap={() => this.handleNewButtonClick()}
            >
              <ContentAdd />
            </FloatingActionButton>
           : null
          }
        </TableHeaderColumn>
      </TableRow>,
      <TableRow key="props">
        {headerColumns}
      </TableRow>,
    ];
  }
  renderRows(entries) {
    const { items, tableSchema } = this.props;
    return items.map((item) => {
      const columns = entries.map(([name, info]) => {
        switch (widgetType(info, tableSchema[name])) {
          case 'link':
            return [name, <a href={item[name]}>{item[name]}</a>];
          case 'image':
            return [name, (
              <a href={item[name]}>
                <img src={item[name]} alt={item[name]} height={imageHeight} />
              </a>
            )];
          case 'audio':
            return [name, (
              <audio controls><track kind="captions" src={item[name]} /></audio>
            )];
          case 'custom': {
            const Widget = tableSchema[name]['ui:widget']
            return [
              name,
              <Widget
                value={item[name]}
                name={name}
                item={item}
                schema={tableSchema[name]}
              />,
            ];
          }
          default:
            return [name, item[name]];
        }
      }).map(([name, child]) => <TableRowColumn key={name}>{child}</TableRowColumn>);
      const actions = [];
      if (Array.isArray(tableSchema['ui:actions'])) {
        tableSchema['ui:actions'].forEach(({ name, icon }) => {
          const Icon = icon;
          actions.push(
            <FloatingActionButton
              key={name}
              mini
              onTouchTap={() => this.props.onAction(name, item)}
            >
              <Icon />
            </FloatingActionButton>,
          );
          actions.push(' ');
        });
      }
      if (this.props.canEdit) {
        actions.push(
          <FloatingActionButton
            key="edit"
            mini
            onTouchTap={() => this.handleEditButtonClick(item)}
          >
            <ContentCreate />
          </FloatingActionButton>,
        );
        actions.push(' ');
      }
      if (this.props.canDestroy) {
        actions.push(
          <FloatingActionButton
            key="destroy"
            mini
            onTouchTap={() => this.handleDestroyButtonClick(item)}
          >
            <ContentRemove />
          </FloatingActionButton>,
        );
        actions.push(' ');
      }
      columns.push((
        <TableRowColumn key="actions">
          {actions}
        </TableRowColumn>
      ));
      return (
        <TableRow key={item.id}>
          {columns}
        </TableRow>
      );
    });
  }
  render() {
    const { schema, tableSchema } = this.props;
    const orders = tableSchema['ui:order'];
    let entries = Object.entries(schema.properties);
    if (Array.isArray(orders)) {
      entries = orders.map(name => [name, schema.properties[name]])
                      .concat(entries.filter(([name]) => !orders.includes(name)));
    }
    entries = entries.filter(([name]) => {
      const v = tableSchema[name];
      return !v || v['ui:widget'] !== 'hidden';
    });
    return (
      <div>
        <Table selectable={false}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            {this.renderHeaderRows(entries)}
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {this.renderRows(entries)}
          </TableBody>
        </Table>
        {this.renderDialog()}
      </div>
    );
  }
}

export default ResourceTable;
