/* Global variables */
var timer;
var dictDoubtGroup = {}
var dictGroupDoubt = {}
var doubtsContainer = []
var recomendedDoubt = 0;
var recomendedCard = 0;


$(document).ready(function() {
    /* Stuff needed when the page loads */
    // Request credentials
    // socket.emit('updateCredentials');                       
    
    // Query state information
    querySession();       

    // To solve a doubt
    $("#btn_answer").click (answerDoubt);                   

    /* 
       Dialog with doubt information:
       - Doubt text
       - Time counter and utils
    */
    // $('#modal_answer').on('show.bs.modal', function (event) {
    //     var button = $(event.relatedTarget);                // Button that triggered the modal
    //     doubtId = button.data('doubtid');                   // Extract info from data-* attributes and store in global variable
    //     timer.start();                                      // Timing start

    //     var modal = $(this);                                // Add doubt text to the modal
    //     var doubtSelector = '#doubt_' + doubtId;
    //     var doubtText = $(doubtSelector + '.card .card-body .card-text').text()
    //     modal.find(".modal-body #modal_doubt_text").text(doubtText);
    // });

    /* ----- Time control code ----- */
    // timer = new Timer();
    // $('#chronoExample .startButton').click(function () {
    //     timer.start();
    // });
    // $('#chronoExample .pauseButton').click(function () {
    //     timer.pause();
    // });
    // $('#chronoExample .resetButton').click(function () {
    //     timer.reset();
    // });
    // timer.addEventListener('secondsUpdated', function (e) {
    //     $('#chronoExample .values').html(timer.getTimeValues().toString());
    // });
    // timer.addEventListener('started', function (e) {
    //     $('#chronoExample .values').html(timer.getTimeValues().toString());
    // });
    // timer.addEventListener('reset', function (e) {
    //     $('#chronoExample .values').html(timer.getTimeValues().toString());
    // });
    // $('#chronoExample .stopButton').click(function () {
    //     timer.stop();
    // });
    /* ----- Time control code ----- */

});


function DoubtClass(number, student, db_text, section, resolved){
    this.number = number;
    this.student = student;
    this.db_text = db_text; 
    this.section = section;
    this.resolved = resolved
}

/**
 * Sets the interface "pop-up" window for the professor to answer a doubt and measure the time spent.
 * @param {*} event 
 */
function answerDoubt(event){

    // time = timer.getTimeValues().toString()                 // Get time
    // timer.stop();                                           // Stop timer
    socket.emit('professor_time', doubtId, time);           // Send time to server
    $('#modal_answer').modal('hide');                       // Hide he modal
}

/**
 * Adds a group to a given place in the UI
 */
socket.on('the_doubt_solved', function(data) {
   console.log('second step');
   var id = data.doubt;
   var group = data.group;
   console.log (id, group);
   solveDoubt (id, group); 
 });


function solveDoubt(doubtId, groupId){
    
    var element = document.getElementById('doubt_' + doubtId);
    element.parentNode.removeChild(element);

    let moreDoubts = false;

    for (i=0; i < doubtsContainer.length; i++) {

        if (!doubtsContainer[i].resolved && numberize(doubtsContainer[i].student) == groupId) {

            if (doubtsContainer[i].number == doubtId) {
                doubtsContainer[i].resolved = true;

                if (moreDoubts) {
                    break;
                }

            } else {
                moreDoubts = true;
            }
        }
    }

    if (!moreDoubts) {
        document.getElementById('bell_'+ desNumberize(groupId)).classList.remove('active-doubt');
    }

    doubtsManage();
}


function addGroup(group){

    var noMembers = "noMembers_"+ group.position;           // Remove no members list item
    $(jq(noMembers)).remove();
    var students = group.students;                          // Add students to the list
    var membersListSelector = jq("members_" + group.position);
    $(membersListSelector).empty();

    // To avoid same Student occupying two places

    if(document.getElementById(students[0].db_id)==null){

        for (var i in students){
            var studentHTML = '<li class=\"list-group-item \" id=\"' + students[i].db_id + '\">' + students[i].name + '</li>';
            $(membersListSelector).append(studentHTML);
            document.getElementById(students[i].db_id).style.backgroundColor="#cce2ff";
        }

        var container=document.getElementById(group.position);
        container.style.backgroundColor="#e0eeff";
        container.style.opacity="1";
        container.style.cursor="pointer";
        container.onclick=function(){
            $("#myModal").modal();
            for (var i in students){
                document.getElementById("modal-body"+i).innerHTML= students[i].name;
                document.getElementById("div"+i).style.display="block";
                document.getElementById("div"+i).style.paddingBottom="2.8rem";
                document.getElementById("progress-badge").innerHTML=document.getElementById("progress_"+group.position).innerHTML;
                document.getElementById("modal-doubt").innerHTML= getGroupRecomendation(group.position);

            }
        }
        document.getElementById("prog_"+ group.position).classList.add("active");
        document.getElementById("bell_"+ group.position).classList.add("active");

        // Black border to new operating group
        $(jq(group.position)).toggleClass('border-secondary border-dark');

        changeProgress(group);                                  // Assigment progress
        // Assigment progress color
        // $(jq("progress_" + group.position)).toggleClass('badge-dark badge-success');
        $(jq("progress_" + group.position)).removeClass('badge-dark').addClass('badge-success');

    }else{
    }
}

socket.on('joinedGroup', function(groupJson){
    var group = JSON.parse(groupJson);
    addGroup(group);
});

function removeGroup(group)
{
    var membersListSelector = jq("members_" + group.position);
    $(membersListSelector).empty();
    var emptyText = '<li class=\"list-group-item\" id=\"noMembers_' + group.row + '_' + group.column + '\"><small>Empty</small></li>';
    $(membersListSelector).append(emptyText);
    // $(jq(group.position)).toggleClass('border-secondary border-dark');
    $(jq("progress_" + group.position)).removeClass('badge-success').addClass('badge-dark');
    defineProgress(group, 0);
}

socket.on('removeGroup', function(groupJson){
    var group = JSON.parse(groupJson);
    removeGroup(group);})
/**
 * Listens to students progress changes.
 */
socket.on('assigment_changeProgress', function(groupJson){
    var group = JSON.parse(groupJson);                      // obj from JSON
    changeProgress(group);
});

/**
 * Listens to students new doubts.
 */
socket.on('doubt_new', function(doubtJson){
    var doubt = JSON.parse(doubtJson);                      // obj from JSON
    appendDoubtStudent(doubt);
    appendDoubt(doubt);
});
/**
 * Keeps updated global variables
 * dictDoubtGroup
 * dictGroupDoubt
 */
function appendDoubtStudent(doubt)
{
    let id = doubt.db_id;
    let group = doubt.group;
    dictDoubtGroup[id.toString()] = group;
    dictGroupDoubt[group.toString()] = id;
}
function getGroup(doubt_id)
{
    let group = dictDoubtGroup[doubt_id.toString()]
    return group;
}

/**
 *  Renders doubt HTML.
 */

function numberize (group) {
    var num1 = parseInt(group.charAt(0));
    var num2 = parseInt(group.charAt(2));
    var res = num1*10 + num2;
    return res;
}

function desNumberize (num) {
    var char1 = Math.round(num /10)
    var char2 = num - char1*10;
    res = String(char1 + '_' + char2);
    return res;
}

function appendDoubt(doubtJson) {

    const nameStudent = document.getElementById(doubtJson.group).getElementsByClassName('list-group-item')[0].innerHTML;
    const newDoubtHTML = 
    '<div class="card" id=\"doubt_' + doubtJson.db_id + '\">' + 
        '<div class="card-body">' +
            '<span class="badge badge-info">Section: ' + doubtJson.section + '</span>' + 
            '<span class="badge">Student: ' + nameStudent + '</span>' + 
            '<p class="card-text">' + doubtJson.text + '</p>' + 
        '</div>' + 
        '<ul class="list-group list-group-flush">' +
            // '<li class="list-group-item list-group-item-secondary">Cras justo odio</li>' +        
        '</ul>' +
        '<div class="card-body">' +
            '<button type=\"button\" onclick=\"solveDoubt('+ doubtJson.db_id + ', '+ numberize(doubtJson.group) + ')\" id=\"'+doubtJson.db_id + '\" class=\"btn btn-primary float-right\"' +
            'data-doubtid=\"'+ doubtJson.db_id + '\">Solve doubt</button>' +            
        '</div>' +
    '</div>' +
    '<br>';
    let doubts = $("#doubts");                              // Locate doubts container
    doubts.append(newDoubtHTML);
    var doubtObject = new DoubtClass (parseInt(doubtJson.db_id), doubtJson.group, doubtJson.text, parseInt(doubtJson.section), false);
    document.getElementById('bell_'+ doubtObject.student).classList.add('active-doubt');
    doubtsContainer.push(doubtObject);
    doubtsManage();                            // Add doubt to doubts container
}

function compareAttention (grupo1, grupo2) {

    let n1 = 0;
    let n2 = 0;
    let result;

    if (grupo1 == grupo2) {
        result = 0;
    } else {
        for (i=0; i < doubtsContainer.length; i++) {

            if (doubtsContainer[i].resolved) {

                if (doubtsContainer[i].student == grupo1) {
                    n1++;

                } else if (doubtsContainer[i].student == grupo2) {
                    n2++;
                }
            }
        }
        let result = n1 - n2; 
    }    
    return result;
}

function doubtsManage () {

    let recomendation = new DoubtClass (1, 1, '', 1, true);
    let i;


    for (i=0; i < doubtsContainer.length; i++){
        
        if (!doubtsContainer[i].resolved) {

            if (recomendation.resolved) {

                recomendation = doubtsContainer[i];

            } else {

                if (compareAttention (recomendation.student, doubtsContainer[i].student) > 0) {

                    recomendation = doubtsContainer[i];
                
                } else {

                    if (compareAttention (recomendation.student, doubtsContainer[i].student) == 0) {

                        if (recomendation.section - doubtsContainer[i].section > 1) {
                            recomendation = doubtsContainer[i];

                        } else if (doubtsContainer[i].section - recomendation.section < 2) {

                            if (recomendation.number > doubtsContainer[i].number) {
                                recomendation = doubtsContainer[i];            
                            }
                        }
                    }
                }
            }    
        }            
    }

    if (!recomendation.resolved) {

        let recomendedCardHTML = document.getElementById(recomendation.student);
        if (recomendedCard != 0) {
            recomendedCard.classList.remove('recomended-student');
        }
        recomendedCardHTML.classList.add('recomended-student');
        recomendedCard = recomendedCardHTML;
        
        let recomendedHTML = document.getElementById('doubt_' + recomendation.number);
        if (recomendedDoubt != 0) {
            recomendedDoubt.classList.remove('recomended');
        }
        recomendedHTML.classList.add('recomended');        
        recomendedDoubt = recomendedHTML;

    } else {
        recomendedCard.classList.remove('recomended-student');
        recomendedDoubt = 0;
        recomendedCard = 0;
    }
}


function getGroupRecomendation(groupId) {
    let recomendation = new DoubtClass (1, 1, ' ', 1, true);
    let i;
    let doubt_text;

    for (i=0; i < doubtsContainer.length; i++){
        
        if (!doubtsContainer[i].resolved && doubtsContainer[i].student==groupId) {

            if (recomendation.resolved) {

                recomendation = doubtsContainer[i];

            } else {

                if (recomendation.section - doubtsContainer[i].section > 1) {
                    recomendation = doubtsContainer[i];

                } else if (doubtsContainer[i].section - recomendation.section < 2) {

                    if (recomendation.number > doubtsContainer[i].number) {
                        recomendation = doubtsContainer[i];            
                    }
                }
            }
        }            
    }

    if (!recomendation.resolved) {
        doubt_text = recomendation.db_text;
    } else {
        doubt_text = 'No current doubts'
    }

    return doubt_text;
}

/**
 * Listens to new answers.
 */
socket.on('new_answer', function(anwserJson)
{
    var answer = JSON.parse(anwserJson);
    var doubtId = answer.doubtid;
    var text = answer.text;
    appendAnswer(doubtId, text);
})

/**
 * Renders answer HTML.
 */
function appendAnswer(doubtId, anwser)
{
    var li = '<li class="list-group-item list-group-item-secondary">'+ anwser +'</li>';        
    $('#doubt_' + doubtId + '> ul').append(li);
}

function jq( myid ) {
    return "#" + myid.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
}

function changeProgress(group){
    $(jq("progress_" + group.position)).text(group.assigmentProgress);
}

function defineProgress(group, progress){
    $(jq("progress_" + group.position)).text(progress);
}

/**
 * Ask for the session state to the server.
 */
function querySession()
{
    socket.emit('classroom_query');
}

/** 
 * Session query result to interface.
 */
socket.on('classroom_query_result', function(stateResultJson)
{
    var state = JSON.parse(stateResultJson);
    var groups = state.groups;
    var doubts = state.doubts;

    for(var i in groups)                                    // Render groups
    {
        addGroup(groups[i]);
    }

    for(var i in doubts)                                    // Render doubts
    {
        appendDoubt(doubts[i]);

        for(var j in doubts[i].answers)                     // Render doubts' answers
        {
            appendAnswer(doubts[i].db_id, doubts[i].answers[j].text);
        }
    }
});

