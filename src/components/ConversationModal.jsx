/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-for */

import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import { Form } from 'formsy-react-components';
import Modal from 'react-modal';

import QuillFormsy from 'components/QuillFormsy';
import LoaderButton from 'components/LoaderButton';
import MilestoneProof from 'components/MilestoneProof';

import { feathersRest } from 'lib/feathersClient';

/**
  A promise modal to file proof when taking action on a milestone

  STEP 1 - Create a ref
  this.conversationModal = React.createRef();

  STEP 2 - Assign ref
  <ConversationModal
    ref={this.conversationModal}
  />

  STEP 3 - Call it
  this.conversationModal.current.openModal({
    title: 'Do this?',
    description: 'Yes!',
    required: false,
    cta: 'Save'
  })
    .then( proof => console.log("Here's your milestone proof: ", proof))
    .catch( () => console.log("canceled!"))
* */

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-40%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    maxHeight: '600px',
  },
};

Modal.setAppElement('#root');

class ConversationModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalIsOpen: false,
      formIsValid: false,
      isSaving: false,
      message: '',
      items: [],
      isBlocking: false,
      required: false,
      enableAttachProof: true,
      token: {},
      textPlaceholder: '',
    };

    this.promise = {};

    this.form = React.createRef();

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.submit = this.submit.bind(this);
  }

  onItemsChanged(items) {
    this.setState({ items });
    this.triggerRouteBlocking();
  }

  openModal({ title, description, cta, required, textPlaceholder, enableAttachProof, token = {} }) {
    this.setState({
      items: [],
      title,
      description,
      CTA: cta,
      modalIsOpen: true,
      required,
      enableAttachProof,
      token,
      textPlaceholder,
    });

    return new Promise((resolve, reject) => {
      this.promise = {
        resolve,
        reject,
      };
    });
  }

  closeModal(reject) {
    if (reject) {
      this.promise.reject();
    } else {
      this.promise.resolve({
        message: this.state.message,
        items: this.state.items,
      });
    }

    this.setState({ modalIsOpen: false });
  }

  /* eslint-disable class-methods-use-this */

  mapInputs(inputs) {
    return {
      message: inputs.message,
    };
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState(prevState => ({
      isBlocking:
        form &&
        (!form.state.formSubmitted ||
          form.state.isSubmitting ||
          (prevState.enableAttachProof && prevState.items.length > 0)),
    }));
  }

  saveProofImages() {
    // construct image upload promises
    const uploadItemImages = [];

    this.state.items.forEach(item => {
      if (item.image) {
        uploadItemImages.push(
          new Promise((resolve, reject) => {
            feathersRest
              .service('uploads')
              .create({ uri: item.image })
              .then(file => {
                item.image = file.url;
                resolve('done');
              })
              .catch(() => reject(new Error('could not upload item image')));
          }),
        );
      }
    });

    // upload images
    return Promise.all(uploadItemImages);
  }

  submit(model) {
    this.saveProofImages()
      .then(() => {
        this.setState(
          prevState => ({
            items: prevState.items,
            message: model.message,
          }),
          () => this.closeModal(),
        );
      })
      .catch(() => {
        this.setState({ isSaving: false, isBlocking: true });
      });
  }

  render() {
    const {
      modalIsOpen,
      message,
      formIsValid,
      isSaving,
      required,
      title,
      description,
      CTA,
      items,
      isBlocking,
      enableAttachProof,
      token,
      textPlaceholder,
    } = this.state;

    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => this.closeModal(true)}
        style={modalStyles}
        contentLabel="Example Modal"
      >
        <div className="conversation-modal">
          <h2>{title}</h2>
          <p className="mb-4">{description}</p>

          <Form
            id="conversation"
            onSubmit={this.submit}
            ref={this.form}
            mapping={inputs => this.mapInputs(inputs)}
            onValid={() => this.toggleFormValid(true)}
            onInvalid={() => this.toggleFormValid(false)}
            onChange={e => this.triggerRouteBlocking(e)}
            layout="vertical"
          >
            <Prompt
              when={isBlocking}
              message={() =>
                `You have unsaved changes. Are you sure you want to navigate from this page?`
              }
            />

            <div className="row">
              <div className={enableAttachProof ? 'col-md-6' : 'col-12'}>
                <QuillFormsy
                  name="message"
                  label="Accompanying message"
                  // {/* helpText="Make it as extensive as necessary. Your goal is to build trust,
                  // so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Milestone"
                  // */}
                  value={message}
                  placeholder={textPlaceholder}
                  validations="minLength:3"
                  validationErrors={{
                    minLength: 'It is really appreciated if you write something meaningful...',
                  }}
                  required={required}
                />
              </div>

              {enableAttachProof && (
                <div className="col-md-6">
                  <label>Attachments</label>
                  <MilestoneProof
                    isEditMode
                    items={items}
                    token={token}
                    onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
                  />
                </div>
              )}
            </div>

            <div className="row">
              <div className="col-12">
                <LoaderButton
                  className="btn btn-success"
                  formNoValidate
                  type="submit"
                  disabled={isSaving || !formIsValid}
                  isLoading={isSaving}
                  loadingText="Saving..."
                >
                  <span>{CTA}</span>
                </LoaderButton>

                <a
                  role="button"
                  tabIndex="-1"
                  className="btn btn-link"
                  disabled={!formIsValid}
                  onClick={() => this.closeModal(true)}
                  onKeyUp={() => this.closeModal(true)}
                >
                  Cancel
                </a>
              </div>
            </div>
          </Form>
        </div>
      </Modal>
    );
  }
}

export default ConversationModal;
